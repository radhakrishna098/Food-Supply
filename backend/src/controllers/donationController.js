const Donation = require('../models/Donation');
const Organization = require('../models/Organization');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const { MatchingEngine } = require('../services/matchingEngine');

// @desc    Create a surplus food donation
// @route   POST /api/donations
// @access  Private (Donor only)
exports.createDonation = async (req, res, next) => {
  try {
    const {
      foodTitle,
      category,
      donorType,
      pinCode,
      description,
      quantity,
      unit,
      estimatedServings,
      dietaryClassification,
      allergenInfo,
      preparationTime,
      collectionWindow,
      storageAndHandling,
      safetyDeclaration,
      pickupAddress,
      coordinates,
      specialCollectionInstructions,
      imageUrl,
    } = req.body;

    // Strict validation
    if (!foodTitle || !category || !quantity || !estimatedServings) {
      return res.status(400).json({
        success: false,
        message: 'Food title, category, quantity, and estimated servings are required',
      });
    }

    const cleanPin = (pinCode || pickupAddress?.pinCode || '110001').trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit Indian PIN code is required for local pickup matching (e.g. 110001)',
      });
    }

    if (!safetyDeclaration || !safetyDeclaration.isSafeAndEdible || !safetyDeclaration.storedAtSafeTemperature) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory food safety declarations must be affirmed prior to donation posting',
      });
    }

    const now = new Date();
    const deadline = new Date(collectionWindow?.deadline);
    const startTime = new Date(collectionWindow?.startTime || now);
    const prepTime = new Date(preparationTime);

    if (isNaN(deadline.getTime()) || deadline <= now) {
      return res.status(400).json({
        success: false,
        message: 'Collection deadline must be a valid future timestamp',
      });
    }

    if (deadline <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'Collection deadline must be scheduled after collection start time',
      });
    }

    if (prepTime > new Date(now.getTime() + 5 * 60 * 1000)) {
      return res.status(400).json({
        success: false,
        message: 'Preparation timestamp cannot be in the future',
      });
    }

    const donorOrg = await Organization.findOne({ owner: req.user._id });

    const donation = await Donation.create({
      donor: req.user._id,
      donorOrg: donorOrg ? donorOrg._id : undefined,
      donorType: donorType || donorOrg?.type || 'restaurant',
      pinCode: cleanPin,
      foodTitle,
      category,
      description: description || '',
      quantity: Number(quantity),
      remainingQuantity: Number(quantity),
      unit: unit || 'portions',
      estimatedServings: Number(estimatedServings),
      dietaryClassification: dietaryClassification || ['vegetarian'],
      allergenInfo: allergenInfo || [],
      preparationTime: prepTime,
      collectionWindow: {
        startTime,
        deadline,
      },
      storageAndHandling: storageAndHandling || {
        storageType: 'room_temperature',
        handlingInstructions: 'Handle with care in clean containers',
      },
      safetyDeclaration: {
        ...safetyDeclaration,
        declaredBy: req.user.name,
        declaredAt: now,
      },
      pickupAddress: {
        ...(pickupAddress || {}),
        pinCode: cleanPin,
        formattedAddress: pickupAddress?.formattedAddress || donorOrg?.address?.formattedAddress || 'Donor Location',
      },
      location: {
        type: 'Point',
        coordinates: coordinates || donorOrg?.location?.coordinates || [77.2090, 28.6139],
      },
      specialCollectionInstructions: specialCollectionInstructions || '',
      imageUrl: imageUrl || '',
      status: 'AVAILABLE',
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'DONATION_CREATED',
      entityType: 'Donation',
      entityId: donation._id,
      newState: donation.toObject(),
      metadata: { quantity, servings: estimatedServings, category },
    });

    // Run matching engine asynchronously to notify top eligible recipient NGOs
    try {
      const matchResult = await MatchingEngine.findMatchesForDonation(donation);
      if (matchResult.eligible && matchResult.eligible.length > 0) {
        const topMatches = matchResult.eligible.slice(0, 3);
        for (const m of topMatches) {
          const org = await Organization.findById(m.organization._id);
          if (org && org.owner) {
            await NotificationService.notify({
              recipient: org.owner,
              type: 'DONATION_MATCH',
              title: 'New Matching Food Rescue Opportunity',
              message: `${donation.foodTitle} (${donation.estimatedServings} servings) matches your intake criteria (${m.distanceKm} km away, ${m.scores.totalScore}% score).`,
              relatedDonation: donation._id,
            });
          }
        }
      }
    } catch (matchErr) {
      console.error('[Async Matching Notification Error]:', matchErr.message);
    }

    res.status(201).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all donations (with filtering & distance)
// @route   GET /api/donations
// @access  Public (with role-specific enhancements)
exports.getDonations = async (req, res, next) => {
  try {
    const { status, category, dietary, search, myDonations, claimableOnly, pinCode, donorType } = req.query;
    const filter = {};

    if (myDonations === 'true' && req.user) {
      filter.donor = req.user._id;
    } else if (status) {
      filter.status = status;
    }

    if (claimableOnly === 'true') {
      filter.status = { $in: ['AVAILABLE', 'PARTIALLY_CLAIMED'] };
      filter.remainingQuantity = { $gt: 0 };
      filter['collectionWindow.deadline'] = { $gt: new Date() };
    }

    if (category) {
      filter.category = category;
    }

    if (dietary) {
      filter.dietaryClassification = dietary;
    }

    if (donorType) {
      filter.donorType = donorType;
    }

    if (pinCode) {
      filter.pinCode = { $regex: `^${pinCode.trim()}` };
    }

    if (search) {
      filter.$or = [
        { foodTitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { pinCode: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const donations = await Donation.find(filter)
      .populate('donor', 'name email phone')
      .populate('donorOrg', 'name type address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
// @access  Public
exports.getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone')
      .populate('donorOrg', 'name type address contactPhone contactEmail');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    res.json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel donation
// @route   POST /api/donations/:id/cancel
// @access  Private (Donor or Admin)
exports.cancelDonation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    // Authorization check
    if (
      req.user.role !== 'admin' &&
      donation.donor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this donation',
      });
    }

    if (['COLLECTED', 'DELIVERED'].includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel donation once it has reached '${donation.status}' state`,
      });
    }

    const previousState = donation.toObject();
    donation.status = 'CANCELLED';
    donation.cancellationReason = reason || 'Cancelled by donor';
    await donation.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'DONATION_CANCELLED',
      entityType: 'Donation',
      entityId: donation._id,
      previousState: { status: previousState.status },
      newState: { status: 'CANCELLED', reason: donation.cancellationReason },
    });

    res.json({
      success: true,
      message: 'Donation cancelled successfully',
      donation,
    });
  } catch (error) {
    next(error);
  }
};
