const Donation = require('../models/Donation');
const { MatchingEngine } = require('../services/matchingEngine');

// @desc    Get feasibility-first matching recommendations for a donation
// @route   GET /api/matching/:donationId
// @access  Private (Donor, Recipient, Admin)
exports.getMatchesForDonation = async (req, res, next) => {
  try {
    const { maxRadius } = req.query;
    const donation = await Donation.findById(req.params.donationId)
      .populate('donor', 'name email phone')
      .populate('donorOrg');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    const options = {};
    if (maxRadius && !isNaN(Number(maxRadius))) {
      options.maxRadiusOverride = Number(maxRadius);
    }

    const matchAnalysis = await MatchingEngine.findMatchesForDonation(donation, options);

    res.json({
      success: true,
      donation: {
        _id: donation._id,
        foodTitle: donation.foodTitle,
        category: donation.category,
        quantity: donation.quantity,
        remainingQuantity: donation.remainingQuantity,
        estimatedServings: donation.estimatedServings,
        dietaryClassification: donation.dietaryClassification,
        collectionWindow: donation.collectionWindow,
        pickupAddress: donation.pickupAddress,
        location: donation.location,
        status: donation.status,
      },
      ...matchAnalysis,
    });
  } catch (error) {
    next(error);
  }
};
