const Donation = require('../models/Donation');
const DonationRequest = require('../models/DonationRequest');
const Organization = require('../models/Organization');
const Pickup = require('../models/Pickup');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const CodeService = require('../services/codeService');
const { MatchingEngine } = require('../services/matchingEngine');

// @desc    Submit claim request for a donation
// @route   POST /api/donations/:id/requests
// @access  Private (Recipient NGO only)
exports.createRequest = async (req, res, next) => {
  try {
    const { requestedQuantity, recipientNotes } = req.body;
    const donationId = req.params.id;

    // Check organization verification
    const org = await Organization.findOne({ owner: req.user._id });
    if (!org) {
      return res.status(400).json({
        success: false,
        message: 'No organization profile found for this user account',
      });
    }

    if (org.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: `Your organization verification status is '${org.verificationStatus}'. Only verified organizations may claim food rescue donations.`,
      });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    if (!donation.isClaimable()) {
      return res.status(400).json({
        success: false,
        message: `This donation is no longer available for claiming (Status: ${donation.status})`,
      });
    }

    const claimQuantity = Number(requestedQuantity) || donation.remainingQuantity;
    if (claimQuantity <= 0 || claimQuantity > donation.remainingQuantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${claimQuantity}) exceeds remaining available quantity (${donation.remainingQuantity})`,
      });
    }

    // Proportionate servings calculation
    const servingsPerUnit = donation.estimatedServings / donation.quantity;
    const requestedServings = Math.round(claimQuantity * servingsPerUnit);

    // Check capacity
    const remainingCapacity = org.getRemainingCapacity();
    if (remainingCapacity < requestedServings) {
      return res.status(400).json({
        success: false,
        message: `Claim of ${requestedServings} servings exceeds your remaining intake capacity today (${remainingCapacity} servings)`,
      });
    }

    // Run matching snapshot
    let matchScoreSnapshot = {};
    try {
      const matchEval = await MatchingEngine.findMatchesForDonation(donation);
      const match = matchEval.eligible.find((m) => m.organization._id.toString() === org._id.toString());
      if (match) {
        matchScoreSnapshot = {
          totalScore: match.scores.totalScore,
          proximityScore: match.scores.proximityScore,
          capacityScore: match.scores.capacityScore,
          timeScore: match.scores.timeScore,
          dietaryScore: match.scores.dietaryScore,
          needScore: match.scores.needScore,
          pickupScore: match.scores.pickupScore,
          distanceKm: match.distanceKm,
          estimatedTransitMinutes: match.estimatedTransitMinutes,
          reasons: match.reasons,
        };
      }
    } catch (e) {
      console.warn('Snapshot error:', e.message);
    }

    // Atomic update to prevent race conditions on quantity
    const updatedDonation = await Donation.findOneAndUpdate(
      {
        _id: donationId,
        remainingQuantity: { $gte: claimQuantity },
        status: { $in: ['AVAILABLE', 'PARTIALLY_CLAIMED'] },
      },
      {
        $inc: { remainingQuantity: -claimQuantity },
        $set: {
          status: donation.remainingQuantity - claimQuantity === 0 ? 'REQUESTED' : 'PARTIALLY_CLAIMED',
        },
      },
      { new: true }
    );

    if (!updatedDonation) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: This donation was claimed by another organization or is no longer available.',
      });
    }

    // Reserve org capacity
    org.currentDailyClaimedServings = (org.currentDailyClaimedServings || 0) + requestedServings;
    await org.save();

    // Create DonationRequest record
    const donationRequest = await DonationRequest.create({
      donation: donationId,
      recipientOrg: org._id,
      requestedBy: req.user._id,
      requestedQuantity: claimQuantity,
      requestedServings,
      matchScoreSnapshot,
      recipientNotes: recipientNotes || '',
      status: 'PENDING',
    });

    // Notify Donor
    await NotificationService.notify({
      recipient: donation.donor,
      type: 'REQUEST_RECEIVED',
      title: 'New Donation Claim Request',
      message: `${org.name} has requested ${claimQuantity} ${donation.unit} (${requestedServings} servings) of ${donation.foodTitle}.`,
      relatedDonation: donation._id,
      relatedRequest: donationRequest._id,
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'REQUEST_CREATED',
      entityType: 'DonationRequest',
      entityId: donationRequest._id,
      newState: donationRequest.toObject(),
      metadata: { requestedQuantity: claimQuantity, requestedServings },
    });

    res.status(201).json({
      success: true,
      donationRequest,
      donation: updatedDonation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept donation claim request & provision pickup
// @route   PATCH /api/requests/:id/accept
// @access  Private (Donor only)
exports.acceptRequest = async (req, res, next) => {
  try {
    const { donorNotes } = req.body;
    const request = await DonationRequest.findById(req.params.id)
      .populate('donation')
      .populate('recipientOrg')
      .populate('requestedBy');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // Authorization
    if (request.donation.donor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status '${request.status}'`,
      });
    }

    // Generate secure 6-digit OTP codes for Handover Verification
    const pickupOtp = CodeService.generateCode();
    const deliveryOtp = CodeService.generateCode();

    const pickupVerificationCodeHash = CodeService.hashCode(pickupOtp);
    const deliveryVerificationCodeHash = CodeService.hashCode(deliveryOtp);

    // Update Request status
    request.status = 'ACCEPTED';
    if (donorNotes) request.donorNotes = donorNotes;
    await request.save();

    // Update Donation status
    await Donation.findByIdAndUpdate(request.donation._id, { status: 'ACCEPTED' });

    // Provision Pickup record
    const pickup = await Pickup.create({
      donationRequest: request._id,
      donation: request.donation._id,
      donor: req.user._id,
      recipientOrg: request.recipientOrg._id,
      recipientUser: request.requestedBy._id,
      status: 'ASSIGNED',
      pickupVerificationCodeHash,
      deliveryVerificationCodeHash,
      pickupCode: pickupOtp,
      deliveryCode: deliveryOtp,
      pickupAddress: {
        formattedAddress: request.donation.pickupAddress.formattedAddress,
        coordinates: request.donation.location.coordinates,
      },
      deliveryAddress: {
        formattedAddress: request.recipientOrg.address.formattedAddress,
        coordinates: request.recipientOrg.location.coordinates,
      },
      timeline: [
        {
          status: 'ASSIGNED',
          timestamp: new Date(),
          updatedBy: req.user._id,
          notes: 'Donation request accepted by donor. Pickup task generated for volunteer dispatch.',
          simulatedLocation: {
            lng: request.donation.location.coordinates[0],
            lat: request.donation.location.coordinates[1],
          },
        },
      ],
    });

    // Notify Recipient NGO
    await NotificationService.notify({
      recipient: request.requestedBy._id,
      type: 'REQUEST_ACCEPTED',
      title: 'Donation Claim Approved!',
      message: `Your claim for ${request.requestedQuantity} ${request.donation.unit} of ${request.donation.foodTitle} was accepted. Pickup is being coordinated.`,
      relatedDonation: request.donation._id,
      relatedRequest: request._id,
      relatedPickup: pickup._id,
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'REQUEST_ACCEPTED',
      entityType: 'DonationRequest',
      entityId: request._id,
      newState: { status: 'ACCEPTED', pickupId: pickup._id },
    });

    res.json({
      success: true,
      message: 'Request accepted and pickup task provisioned successfully',
      request,
      pickup: {
        _id: pickup._id,
        status: pickup.status,
        pickupCode: pickup.pickupCode, // Donor can see their pickup OTP to share with volunteer
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject donation claim request
// @route   PATCH /api/requests/:id/reject
// @access  Private (Donor only)
exports.rejectRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await DonationRequest.findById(req.params.id)
      .populate('donation')
      .populate('recipientOrg');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    if (request.donation.donor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status '${request.status}'`,
      });
    }

    request.status = 'REJECTED';
    request.donorNotes = reason || 'Declined by donor';
    await request.save();

    // Re-credit quantity back to donation
    const donation = await Donation.findById(request.donation._id);
    if (donation) {
      donation.remainingQuantity += request.requestedQuantity;
      if (['REQUESTED', 'PARTIALLY_CLAIMED'].includes(donation.status)) {
        donation.status = 'AVAILABLE';
      }
      await donation.save();
    }

    // Re-credit org capacity
    const org = await Organization.findById(request.recipientOrg._id);
    if (org) {
      org.currentDailyClaimedServings = Math.max(
        0,
        (org.currentDailyClaimedServings || 0) - request.requestedServings
      );
      await org.save();
    }

    // Notify Recipient NGO
    await NotificationService.notify({
      recipient: request.requestedBy,
      type: 'REQUEST_REJECTED',
      title: 'Donation Request Declined',
      message: `Your request for ${donation.foodTitle} was declined: ${request.donorNotes}`,
      relatedDonation: donation._id,
      relatedRequest: request._id,
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'REQUEST_REJECTED',
      entityType: 'DonationRequest',
      entityId: request._id,
      newState: { status: 'REJECTED', reason: request.donorNotes },
    });

    res.json({
      success: true,
      message: 'Request rejected successfully',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests for current user (either donor or recipient)
// @route   GET /api/requests/me
// @access  Private
exports.getMyRequests = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'recipient') {
      filter.requestedBy = req.user._id;
    } else if (req.user.role === 'donor') {
      // Find all donations belonging to donor
      const donorDonations = await Donation.find({ donor: req.user._id }).select('_id');
      const donationIds = donorDonations.map((d) => d._id);
      filter.donation = { $in: donationIds };
    }

    const requests = await DonationRequest.find(filter)
      .populate('donation')
      .populate('recipientOrg')
      .populate('requestedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};
