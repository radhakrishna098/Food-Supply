const mongoose = require('mongoose');
const { MatchingEngine, calculateHaversineDistance, estimateTransitMinutes } = require('../services/matchingEngine');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const User = require('../models/User');

describe('FoodLoop Matching Engine — Feasibility-First Decision Tests', () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodloop';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('Haversine distance calculation is accurate', () => {
    // Connaught Place [28.6328, 77.2197] to Paharganj [28.6430, 77.2120] ~1.4 - 1.5 km
    const dist = calculateHaversineDistance(28.6328, 77.2197, 28.6430, 77.2120);
    expect(dist).toBeGreaterThan(1.0);
    expect(dist).toBeLessThan(2.0);
  });

  test('Transit time approximation includes city speed and buffer', () => {
    // 5 km distance => (5/30)*60 = 10 mins + 15 min buffer = 25 mins
    const transit = estimateTransitMinutes(5);
    expect(transit).toBe(25);
  });

  test('Hard eligibility gates: Excludes unverified NGO, low capacity NGO, and distant NGO', async () => {
    const donation = await Donation.findOne({
      foodTitle: /50 Gourmet Vegetarian Meal Portions/,
    });
    expect(donation).toBeDefined();

    const result = await MatchingEngine.findMatchesForDonation(donation);

    expect(result.success).toBe(true);
    expect(result.hasFeasibleMatch).toBe(true);
    expect(result.eligible.length).toBeGreaterThan(0);

    // Verify that Hope Community Shelter is eligible and ranked near or at top
    const hopeMatch = result.eligible.find((m) => m.organization.name.includes('Hope Community Shelter'));
    expect(hopeMatch).toBeDefined();
    expect(hopeMatch.scores.totalScore).toBeGreaterThanOrEqual(80);
    expect(hopeMatch.reasons.length).toBeGreaterThan(0);

    // Verify that Eastside (unverified) is filtered into ineligible
    const unverifiedMatch = result.ineligible.find((m) => m.organization.name.includes('Eastside'));
    expect(unverifiedMatch).toBeDefined();
    const verificationGateFail = unverifiedMatch.gateFailures.find((g) => g.gate === 'VERIFICATION');
    expect(verificationGateFail).toBeDefined();

    // Verify that Sunrise Children Haven (insufficient capacity) is filtered into ineligible
    const lowCapMatch = result.ineligible.find((m) => m.organization.name.includes('Sunrise Children'));
    expect(lowCapMatch).toBeDefined();
    const capacityGateFail = lowCapMatch.gateFailures.find((g) => g.gate === 'CAPACITY_EXCEEDED');
    expect(capacityGateFail).toBeDefined();

    // Verify that South Suburban Care (outside radius) is filtered into ineligible
    const distantMatch = result.ineligible.find((m) => m.organization.name.includes('South Suburban'));
    expect(distantMatch).toBeDefined();
    const radiusGateFail = distantMatch.gateFailures.find((g) => g.gate === 'SERVICE_RADIUS');
    expect(radiusGateFail).toBeDefined();
  });

  test('No-match fallback logic triggers recommendations when no recipient matches', async () => {
    const frozenSeafoodDonation = await Donation.findOne({
      foodTitle: /Frozen Salmon/,
    });
    expect(frozenSeafoodDonation).toBeDefined();

    const result = await MatchingEngine.findMatchesForDonation(frozenSeafoodDonation);

    expect(result.success).toBe(true);
    expect(result.hasFeasibleMatch).toBe(false);
    expect(result.eligible.length).toBe(0);
    expect(result.ineligible.length).toBeGreaterThan(0);
    expect(result.fallbackAdvice.length).toBeGreaterThan(0);

    // Fallback advice should suggest splitting batch or expanding radius
    const adviceTypes = result.fallbackAdvice.map((a) => a.type);
    expect(adviceTypes.some((t) => ['SPLIT_BATCH', 'EXPAND_RADIUS', 'COMMUNITY_BROADCAST'].includes(t))).toBe(true);
  });

  test('Indian PIN-code tier prioritization: Prioritizes SAME_PIN organizations before nearby areas', async () => {
    const donation = await Donation.findOne({
      foodTitle: /50 Gourmet Vegetarian Meal Portions/,
    });
    expect(donation).toBeDefined();
    expect(donation.pinCode).toBe('110001');

    const result = await MatchingEngine.findMatchesForDonation(donation);
    expect(result.success).toBe(true);
    expect(result.pinCodeSummary).toBeDefined();
    expect(result.pinCodeSummary.donationPinCode).toBe('110001');
    expect(result.pinCodeSummary.exactPinMatches).toBeGreaterThanOrEqual(1);

    // Verify top ranked eligible recipients are SAME_PIN (110001)
    const firstMatch = result.eligible[0];
    expect(firstMatch.pinTier).toBe('SAME_PIN');
    expect(firstMatch.organization.address.pinCode).toBe('110001');

    // Ensure all SAME_PIN recipients appear before any NEARBY_PIN or REGIONAL_PIN
    let seenNonSamePin = false;
    for (const match of result.eligible) {
      if (match.pinTier !== 'SAME_PIN') {
        seenNonSamePin = true;
      } else {
        expect(seenNonSamePin).toBe(false);
      }
    }
  });
});
