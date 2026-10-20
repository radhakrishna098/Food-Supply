const Organization = require('../models/Organization');
const DonationRequest = require('../models/DonationRequest');

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula
 * @param {number} lat1 Latitude 1
 * @param {number} lon1 Longitude 1
 * @param {number} lat2 Latitude 2
 * @param {number} lon2 Longitude 2
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Estimates driving transit time using transparent urban approximation (30 km/h average + 15 min buffer)
 * @param {number} distanceKm
 * @returns {number} Estimated transit minutes
 */
function estimateTransitMinutes(distanceKm) {
  const citySpeedKmPerHour = 30;
  const bufferMinutes = 15; // Pickup preparation & parking buffer
  const drivingMinutes = Math.round((distanceKm / citySpeedKmPerHour) * 60);
  return drivingMinutes + bufferMinutes;
}

class MatchingEngine {
  /**
   * Evaluates all potential recipient organizations for a given donation
   * Applies hard eligibility gates, multi-factor scoring, and transparent explanations
   *
   * @param {Object} donation Mongoose Donation document or plain object
   * @param {Object} options Optional filters { maxRadiusOverride, forceIncludeUnverified }
   * @returns {Object} { eligible: [...], ineligible: [...], summary: {...}, fallbackAdvice: [...] }
   */
  static async findMatchesForDonation(donation, options = {}) {
    const now = new Date();
    const deadline = new Date(donation.collectionWindow.deadline);
    const minutesUntilDeadline = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (60 * 1000)));

    const donorCoords = donation.location?.coordinates || [77.2090, 28.6139]; // [lon, lat]
    const donorLon = donorCoords[0];
    const donorLat = donorCoords[1];
    const donorPin = (donation.pinCode || donation.pickupAddress?.pinCode || '110001').trim();

    // Fetch all organizations
    const organizations = await Organization.find({}).populate('owner', 'name email phone');

    const eligible = [];
    const ineligible = [];

    // Analyze each organization
    for (const org of organizations) {
      const remainingCapacity = org.getRemainingCapacity ? org.getRemainingCapacity() : Math.max(0, org.maxDailyCapacityServings - (org.currentDailyClaimedServings || 0));

      const orgCoords = org.location?.coordinates || [0, 0];
      const orgLon = orgCoords[0];
      const orgLat = orgCoords[1];
      const orgPin = (org.address?.pinCode || '110001').trim();

      // PIN code match tiers
      let pinMatchTier = 'REGIONAL_PIN';
      if (orgPin === donorPin) {
        pinMatchTier = 'SAME_PIN';
      } else if (orgPin.slice(0, 3) === donorPin.slice(0, 3)) {
        pinMatchTier = 'NEARBY_PIN';
      }

      const distanceKm = calculateHaversineDistance(donorLat, donorLon, orgLat, orgLon);
      const transitMinutes = estimateTransitMinutes(distanceKm);
      const effectiveRadius = options.maxRadiusOverride || org.serviceRadiusKm || 15;

      const gateFailures = [];

      // ==========================================
      // STEP 1: HARD ELIGIBILITY GATES
      // ==========================================

      // Gate 1: Verification status
      if (org.verificationStatus !== 'verified') {
        gateFailures.push({
          gate: 'VERIFICATION',
          reason: `Organization verification status is '${org.verificationStatus}'. Platform verification required before claiming surplus food.`,
        });
      }

      // Gate 2: Active status
      if (!org.isActive) {
        gateFailures.push({
          gate: 'ACTIVE_STATUS',
          reason: 'Organization is currently marked inactive or temporarily closed.',
        });
      }

      // Gate 3: Food Category Acceptance
      const acceptsCategory = org.acceptedFoodCategories && (
        org.acceptedFoodCategories.length === 0 ||
        org.acceptedFoodCategories.includes(donation.category)
      );
      if (!acceptsCategory) {
        gateFailures.push({
          gate: 'FOOD_CATEGORY',
          reason: `Incompatible category: Organization does not accept '${donation.category}'.`,
        });
      }

      // Gate 4: Dietary Compatibility
      const orgDietary = org.dietaryPreferences || [];
      const donationDietary = donation.dietaryClassification || [];

      // If NGO is strictly vegetarian/vegan, donation cannot contain non_vegetarian
      const isStrictlyVegetarianOrg = orgDietary.includes('vegetarian') || orgDietary.includes('vegan');
      const isDonationNonVeg = donationDietary.includes('non_vegetarian');

      if (isStrictlyVegetarianOrg && isDonationNonVeg) {
        gateFailures.push({
          gate: 'DIETARY_RESTRICTION',
          reason: 'Dietary incompatibility: Organization strictly serves vegetarian/vegan meals and cannot accept non-vegetarian food.',
        });
      }

      // Gate 5: Capacity Check
      const requiredServings = donation.estimatedServings || 1;
      if (remainingCapacity < requiredServings) {
        gateFailures.push({
          gate: 'CAPACITY_EXCEEDED',
          reason: `Insufficient capacity: Donation requires ${requiredServings} servings, but organization has only ${remainingCapacity} remaining servings capacity today.`,
        });
      }

      // Gate 6: Service Radius
      if (distanceKm > effectiveRadius) {
        gateFailures.push({
          gate: 'SERVICE_RADIUS',
          reason: `Outside service radius: Recipient is ${distanceKm.toFixed(1)} km away, exceeding organization limit of ${effectiveRadius} km.`,
        });
      }

      // Gate 7: Time Feasibility & Safety Window
      if (transitMinutes > minutesUntilDeadline) {
        gateFailures.push({
          gate: 'TIME_EXPIRED',
          reason: `Infeasible deadline: Transit & handover buffer requires ${transitMinutes} mins, but collection deadline is in ${minutesUntilDeadline} mins.`,
        });
      }

      // Check conflicting active claims
      const activeClaimsCount = await DonationRequest.countDocuments({
        recipientOrg: org._id,
        status: { $in: ['PENDING', 'ACCEPTED'] },
      });
      if (activeClaimsCount >= 5 && remainingCapacity <= requiredServings * 1.2) {
        gateFailures.push({
          gate: 'CONCURRENT_CLAIMS',
          reason: 'Organization has multiple pending claims reaching peak intake throughput.',
        });
      }

      // ==========================================
      // EVALUATION BRANCHING
      // ==========================================

      if (gateFailures.length > 0) {
        ineligible.push({
          organization: {
            _id: org._id,
            name: org.name,
            type: org.type,
            formattedAddress: org.address?.formattedAddress || '',
            pinCode: orgPin,
            address: {
              pinCode: orgPin,
              formattedAddress: org.address?.formattedAddress || '',
            },
            coordinates: orgCoords,
            verificationStatus: org.verificationStatus,
            maxDailyCapacityServings: org.maxDailyCapacityServings,
            remainingCapacity,
            serviceRadiusKm: org.serviceRadiusKm,
            acceptedFoodCategories: org.acceptedFoodCategories,
            dietaryPreferences: org.dietaryPreferences,
          },
          pinMatchTier,
          pinTier: pinMatchTier,
          distanceKm,
          estimatedTransitMinutes: transitMinutes,
          gateFailures,
          reasons: gateFailures.map((gf) => gf.reason),
        });
      } else {
        // ==========================================
        // STEP 2: SCORING ELIGIBLE CANDIDATES (0 - 100)
        // ==========================================

        // Factor 1: Proximity Score (Weight: 25%)
        // 0 km = 100 pts, distance up to effectiveRadius drops to 0
        const proximityRatio = Math.max(0, 1 - distanceKm / effectiveRadius);
        const proximityScore = Math.round(proximityRatio * 100);

        // Factor 2: Quantity & Capacity Fit (Weight: 20%)
        // Optimal fit when donation utilizes 50% - 90% of available capacity
        const capacityUtilization = requiredServings / remainingCapacity;
        let capacityScore = 60;
        if (capacityUtilization >= 0.5 && capacityUtilization <= 0.9) {
          capacityScore = 100;
        } else if (capacityUtilization > 0.9) {
          capacityScore = 85; // tight fit
        } else if (capacityUtilization >= 0.25) {
          capacityScore = 80;
        } else {
          capacityScore = 70; // small portion relative to capacity
        }

        // Factor 3: Collection-Time Feasibility & Margin (Weight: 25%)
        // Safety margin = minutesUntilDeadline - transitMinutes
        const safetyMarginMinutes = minutesUntilDeadline - transitMinutes;
        let timeScore = 40;
        if (safetyMarginMinutes >= 180) {
          timeScore = 100; // >3 hours margin
        } else if (safetyMarginMinutes >= 120) {
          timeScore = 90; // 2-3 hours
        } else if (safetyMarginMinutes >= 60) {
          timeScore = 80; // 1-2 hours
        } else if (safetyMarginMinutes >= 30) {
          timeScore = 65; // 30-60 mins
        } else {
          timeScore = 50; // tight <30 mins
        }

        // Factor 4: Dietary and Food-Category Compatibility (Weight: 15%)
        let dietaryScore = 80;
        // Perfect match if exact dietary overlap
        if (
          donationDietary.some((d) => orgDietary.includes(d)) ||
          orgDietary.includes('any')
        ) {
          dietaryScore = 100;
        }

        // Factor 5: Recipient Need & Demand (Weight: 10%)
        // If organization has low daily intake so far, urgency to serve is higher
        const intakeRatio = (org.currentDailyClaimedServings || 0) / org.maxDailyCapacityServings;
        let needScore = 75;
        if (intakeRatio < 0.2) {
          needScore = 100; // Fresh capacity, high need today
        } else if (intakeRatio < 0.6) {
          needScore = 85;
        } else {
          needScore = 70;
        }

        // Factor 6: Pickup Readiness & Fleet Availability (Weight: 5%)
        let pickupScore = org.hasVehicle ? 100 : 70;

        // Weighted Total Calculation
        const totalScore = Math.round(
          proximityScore * 0.25 +
          capacityScore * 0.20 +
          timeScore * 0.25 +
          dietaryScore * 0.15 +
          needScore * 0.10 +
          pickupScore * 0.05
        );

        // ==========================================
        // STEP 3: EXPLAIN RECOMMENDATION
        // ==========================================
        const positiveReasons = [];
        const warnings = [];

        // PIN-code tier prioritization reason
        if (pinMatchTier === 'SAME_PIN') {
          positiveReasons.push(`🎯 Same PIN-code Priority (PIN ${donorPin}): Local organization in your immediate neighborhood for fastest pickup.`);
        } else if (pinMatchTier === 'NEARBY_PIN') {
          positiveReasons.push(`📍 Adjacent PIN District (PIN ${orgPin}): Nearby area match (${distanceKm.toFixed(1)} km away).`);
        }

        if (distanceKm <= 5) {
          positiveReasons.push(`Exceptional proximity: Only ${distanceKm.toFixed(1)} km away (${transitMinutes} mins transit).`);
        } else {
          positiveReasons.push(`Within feasible range: ${distanceKm.toFixed(1)} km away.`);
        }

        if (capacityScore >= 85) {
          positiveReasons.push(`Optimal capacity match: ${requiredServings} servings utilizes ${(capacityUtilization * 100).toFixed(0)}% of remaining daily intake.`);
        } else {
          positiveReasons.push(`Capacity available: ${remainingCapacity} remaining servings.`);
        }

        if (safetyMarginMinutes >= 120) {
          positiveReasons.push(`Generous collection buffer: ${(safetyMarginMinutes / 60).toFixed(1)} hours safety window before expiry.`);
        } else if (safetyMarginMinutes < 45) {
          warnings.push(`Urgent pickup required: Only ${safetyMarginMinutes} minutes buffer remaining after travel.`);
        }

        if (dietaryScore === 100) {
          positiveReasons.push('Direct dietary compatibility with recipient organization mission.');
        }

        if (org.hasVehicle) {
          positiveReasons.push('Recipient possesses internal logistics/transport fleet for direct self-collection.');
        }

        eligible.push({
          organization: {
            _id: org._id,
            name: org.name,
            type: org.type,
            formattedAddress: org.address?.formattedAddress || '',
            pinCode: orgPin,
            address: {
              pinCode: orgPin,
              formattedAddress: org.address?.formattedAddress || '',
            },
            coordinates: orgCoords,
            verificationStatus: org.verificationStatus,
            maxDailyCapacityServings: org.maxDailyCapacityServings,
            remainingCapacity,
            serviceRadiusKm: org.serviceRadiusKm,
            acceptedFoodCategories: org.acceptedFoodCategories,
            dietaryPreferences: org.dietaryPreferences,
            hasVehicle: org.hasVehicle,
            hasRefrigeration: org.hasRefrigeration,
            contactPhone: org.contactPhone,
            contactEmail: org.contactEmail,
          },
          pinMatchTier,
          pinTier: pinMatchTier,
          distanceKm,
          estimatedTransitMinutes: transitMinutes,
          safetyMarginMinutes,
          scores: {
            totalScore,
            proximityScore,
            capacityScore,
            timeScore,
            dietaryScore,
            needScore,
            pickupScore,
          },
          reasons: positiveReasons,
          warnings,
        });
      }
    }

    // Match eligible organizations in the same PIN-code area first;
    // if none or secondary, sort by totalScore
    eligible.sort((a, b) => {
      if (a.pinMatchTier === 'SAME_PIN' && b.pinMatchTier !== 'SAME_PIN') return -1;
      if (b.pinMatchTier === 'SAME_PIN' && a.pinMatchTier !== 'SAME_PIN') return 1;
      return b.scores.totalScore - a.scores.totalScore;
    });

    // ==========================================
    // STEP 4: NO-MATCH FALLBACK ADVICE
    // ==========================================
    const fallbackAdvice = [];
    if (eligible.length === 0) {
      // Analyze why no matches were found
      const radiusFails = ineligible.filter((i) => i.gateFailures.some((g) => g.gate === 'SERVICE_RADIUS'));
      const capacityFails = ineligible.filter((i) => i.gateFailures.some((g) => g.gate === 'CAPACITY_EXCEEDED'));
      const timeFails = ineligible.filter((i) => i.gateFailures.some((g) => g.gate === 'TIME_EXPIRED'));
      const categoryFails = ineligible.filter((i) => i.gateFailures.some((g) => g.gate === 'FOOD_CATEGORY'));
      const unverifiedCount = ineligible.filter((i) => i.gateFailures.some((g) => g.gate === 'VERIFICATION')).length;

      if (radiusFails.length > 0) {
        fallbackAdvice.push({
          type: 'EXPAND_RADIUS',
          action: 'Expand search radius',
          detail: `${radiusFails.length} organization(s) are located just outside standard radius. Expand search to 25 km or 35 km to view them.`,
        });
      }

      if (capacityFails.length > 0) {
        fallbackAdvice.push({
          type: 'SPLIT_BATCH',
          action: 'Split donation quantity',
          detail: `${capacityFails.length} organization(s) were excluded solely due to large batch size (${donation.estimatedServings} servings). Consider partitioning into smaller lots.`,
        });
      }

      if (timeFails.length > 0) {
        fallbackAdvice.push({
          type: 'DISPATCH_VOLUNTEER',
          action: 'Request urgent volunteer courier',
          detail: 'Collection window is tight. Dispatching an express volunteer courier can compress handover transit times.',
        });
      }

      if (unverifiedCount > 0) {
        fallbackAdvice.push({
          type: 'PENDING_VERIFICATION',
          action: 'Administrator review',
          detail: `${unverifiedCount} nearby organization(s) have pending verification applications awaiting admin audit.`,
        });
      }

      if (fallbackAdvice.length === 0) {
        fallbackAdvice.push({
          type: 'COMMUNITY_BROADCAST',
          action: 'Broadcast alert to regional network',
          detail: 'No registered organizations match current criteria. Broadcast alert to certified regional emergency pantries.',
        });
      }
    }

    const samePinMatchesCount = eligible.filter((e) => e.pinMatchTier === 'SAME_PIN').length;
    const nearbyPinMatchesCount = eligible.filter((e) => e.pinMatchTier === 'NEARBY_PIN').length;

    return {
      success: true,
      donationId: donation._id,
      evaluatedAt: now,
      totalEvaluated: organizations.length,
      eligibleCount: eligible.length,
      ineligibleCount: ineligible.length,
      hasFeasibleMatch: eligible.length > 0,
      pinCodeSummary: {
        donorPinCode: donorPin,
        donationPinCode: donorPin,
        samePinMatchesCount,
        exactPinMatches: samePinMatchesCount,
        nearbyPinMatchesCount,
        nearbyPinMatches: nearbyPinMatchesCount,
        statusMessage: samePinMatchesCount > 0
          ? `Prioritizing ${samePinMatchesCount} eligible organization(s) in the same PIN-code area (${donorPin}).`
          : `No suitable organizations found in PIN ${donorPin}. Expanded search to nearby areas.`,
      },
      eligible,
      ineligible,
      fallbackAdvice,
    };
  }
}

module.exports = {
  MatchingEngine,
  calculateHaversineDistance,
  estimateTransitMinutes,
};
