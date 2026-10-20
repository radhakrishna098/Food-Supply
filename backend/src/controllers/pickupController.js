const Pickup = require('../models/Pickup');
const Donation = require('../models/Donation');
const DonationRequest = require('../models/DonationRequest');
const User = require('../models/User');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const CodeService = require('../services/codeService');

// Sanitize pickup object based on the user's role
function sanitizePickupForUser(pickup, userId, userRole) {
  const p = pickup.toObject ? pickup.toObject() : { ...pickup };

  // Never send hashes to frontend
  delete p.pickupVerificationCodeHash;
  delete p.deliveryVerificationCodeHash;

  // Donor should only see pickupCode (to provide to courier)
  // Recipient should only see deliveryCode (to provide to courier)
  // Volunteer and unassigned users should see neither code
  const isDonor = p.donor?._id?.toString() === userId.toString() || p.donor?.toString() === userId.toString();
  const isRecipient = p.recipientUser?._id?.toString() === userId.toString() || p.recipientUser?.toString() === userId.toString();

  if (!isDonor && userRole !== 'admin') {
    delete p.pickupCode;
  }
  if (!isRecipient && userRole !== 'admin') {
    delete p.deliveryCode;
  }

  return p;
}

// @desc    Get all pickups accessible to the current user
// @route   GET /api/pickups
// @access  Private
exports.getPickups = async (req, res, next) => {
  try {
    const { status, availableTasks } = req.query;
    let query = {};

    if (req.user.role === 'volunteer') {
      if (availableTasks === 'true') {
        // Available tasks awaiting a volunteer
        query = { status: 'ASSIGNED' };
      } else {
        // Volunteer's own accepted or active tasks
        query = { assignedVolunteer: req.user._id };
      }
    } else if (req.user.role === 'donor') {
      query = { donor: req.user._id };
    } else if (req.user.role === 'recipient') {
      query = { recipientUser: req.user._id };
    }

    if (status) {
      query.status = status;
    }

    const pickups = await Pickup.find(query)
      .populate('donation')
      .populate('donationRequest')
      .populate('donor', 'name email phone')
      .populate('recipientOrg', 'name type address location contactPhone contactEmail')
      .populate('recipientUser', 'name email phone')
      .populate('assignedVolunteer', 'name email phone volunteerProfile')
      .sort({ createdAt: -1 });

    const sanitized = pickups.map((p) => sanitizePickupForUser(p, req.user._id, req.user.role));

    res.json({
      success: true,
      count: sanitized.length,
      pickups: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pickup by ID
// @route   GET /api/pickups/:id
// @access  Private
exports.getPickupById = async (req, res, next) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('donation')
      .populate('donationRequest')
      .populate('donor', 'name email phone')
      .populate('recipientOrg')
      .populate('recipientUser', 'name email phone')
      .populate('assignedVolunteer', 'name email phone volunteerProfile');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    const sanitized = sanitizePickupForUser(pickup, req.user._id, req.user.role);

    res.json({
      success: true,
      pickup: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Volunteer accepts an assigned pickup task
// @route   POST /api/pickups/:id/assign
// @access  Private (Volunteer only)
exports.assignVolunteer = async (req, res, next) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('donation')
      .populate('recipientOrg');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found',
      });
    }

    if (pickup.status !== 'ASSIGNED') {
      return res.status(400).json({
        success: false,
        message: `Task is already in status '${pickup.status}' and cannot be claimed`,
      });
    }

    pickup.assignedVolunteer = req.user._id;
    pickup.status = 'ACCEPTED_BY_VOLUNTEER';
    pickup.timeline.push({
      status: 'ACCEPTED_BY_VOLUNTEER',
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: `Volunteer ${req.user.name} accepted the food rescue mission.`,
      simulatedLocation: {
        lng: pickup.pickupAddress.coordinates[0],
        lat: pickup.pickupAddress.coordinates[1],
      },
    });

    await pickup.save();

    // Update donation status
    await Donation.findByIdAndUpdate(pickup.donation._id, { status: 'PICKUP_SCHEDULED' });

    // Notify Donor & Recipient
    await NotificationService.notify({
      recipient: pickup.donor,
      type: 'VOLUNTEER_ASSIGNED',
      title: 'Volunteer Courier Assigned',
      message: `${req.user.name} has accepted the pickup task for ${pickup.donation.foodTitle}.`,
      relatedPickup: pickup._id,
    });

    await NotificationService.notify({
      recipient: pickup.recipientUser,
      type: 'VOLUNTEER_ASSIGNED',
      title: 'Volunteer Courier En Route Soon',
      message: `${req.user.name} is coordinating the delivery of your claimed food.`,
      relatedPickup: pickup._id,
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'VOLUNTEER_ACCEPTED_TASK',
      entityType: 'Pickup',
      entityId: pickup._id,
      newState: { status: 'ACCEPTED_BY_VOLUNTEER', volunteer: req.user._id },
    });

    const sanitized = sanitizePickupForUser(pickup, req.user._id, req.user.role);

    res.json({
      success: true,
      message: 'Mission accepted! Please proceed to pickup location.',
      pickup: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pickup status (EN_ROUTE, ARRIVED_AT_DONOR, ARRIVED_AT_RECIPIENT)
// @route   PATCH /api/pickups/:id/status
// @access  Private (Volunteer or Admin)
exports.updatePickupStatus = async (req, res, next) => {
  try {
    const { status, notes, simulatedLocation } = req.body;
    const pickup = await Pickup.findById(req.params.id).populate('donation');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      pickup.assignedVolunteer?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned volunteer can update transport status',
      });
    }

    // Validate legal transitions
    const validTransitions = {
      ASSIGNED: ['ACCEPTED_BY_VOLUNTEER', 'CANCELLED'],
      ACCEPTED_BY_VOLUNTEER: ['EN_ROUTE', 'ARRIVED_AT_DONOR', 'CANCELLED'],
      EN_ROUTE: ['ARRIVED_AT_DONOR', 'CANCELLED'],
      ARRIVED_AT_DONOR: ['CANCELLED'], // Requires verifyHandover OTP to become COLLECTED
      COLLECTED: ['ARRIVED_AT_RECIPIENT', 'FAILED'],
      ARRIVED_AT_RECIPIENT: ['FAILED'], // Requires verifyHandover OTP to become DELIVERED
      DELIVERED: [],
      CANCELLED: [],
      FAILED: [],
    };

    if (status === 'COLLECTED' || status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: `Status '${status}' cannot be set directly. It requires secure handover verification OTP.`,
      });
    }

    const allowed = validTransitions[pickup.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Illegal transition: Cannot transition from '${pickup.status}' to '${status}'.`,
      });
    }

    pickup.status = status;
    pickup.timeline.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: notes || `Courier status updated to ${status}.`,
      simulatedLocation: simulatedLocation || {
        lng: pickup.pickupAddress.coordinates[0],
        lat: pickup.pickupAddress.coordinates[1],
      },
    });

    await pickup.save();

    await NotificationService.notify({
      recipient: pickup.recipientUser,
      type: 'PICKUP_UPDATE',
      title: 'Rescue Delivery Status Update',
      message: `Your food rescue task status is now: ${status.replace(/_/g, ' ')}.`,
      relatedPickup: pickup._id,
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'PICKUP_STATUS_UPDATE',
      entityType: 'Pickup',
      entityId: pickup._id,
      newState: { status, notes },
    });

    const sanitized = sanitizePickupForUser(pickup, req.user._id, req.user.role);

    res.json({
      success: true,
      pickup: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify handover OTP at pickup or delivery site
// @route   POST /api/pickups/:id/verify-handover
// @access  Private (Volunteer or Admin)
exports.verifyHandover = async (req, res, next) => {
  try {
    const { handoverType, code, notes } = req.body; // handoverType: 'pickup' | 'delivery'
    const pickup = await Pickup.findById(req.params.id)
      .populate('donation')
      .populate('donationRequest');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      pickup.assignedVolunteer?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned volunteer courier can submit handover codes',
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide the 6-digit verification code provided by the handover party',
      });
    }

    const cleanCode = code.trim();

    if (handoverType === 'pickup') {
      if (pickup.status === 'COLLECTED' || pickup.status === 'DELIVERED') {
        return res.status(400).json({
          success: false,
          message: 'Pickup collection was already verified.',
        });
      }

      const isValid = CodeService.verifyCode(cleanCode, pickup.pickupVerificationCodeHash);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Donor Verification Code. Please verify the 6-digit code shown on the Donor screen.',
        });
      }

      // Valid pickup! Transition states
      pickup.status = 'COLLECTED';
      pickup.collectedAt = new Date();
      pickup.timeline.push({
        status: 'COLLECTED',
        timestamp: new Date(),
        updatedBy: req.user._id,
        notes: notes || 'Donor verification code confirmed. Surplus food safely collected.',
        simulatedLocation: {
          lng: pickup.pickupAddress.coordinates[0],
          lat: pickup.pickupAddress.coordinates[1],
        },
      });

      await pickup.save();
      await Donation.findByIdAndUpdate(pickup.donation._id, { status: 'PICKED_UP' });

      // Notify parties
      await NotificationService.notify({
        recipient: pickup.donor,
        type: 'COLLECTED',
        title: 'Food Donation Picked Up',
        message: `Volunteer courier has successfully collected ${pickup.donation.foodTitle}.`,
        relatedPickup: pickup._id,
      });

      await NotificationService.notify({
        recipient: pickup.recipientUser,
        type: 'COLLECTED',
        title: 'Food En Route to Your Shelter',
        message: `Surplus food was collected from the donor and is now on the way to you!`,
        relatedPickup: pickup._id,
      });

      await AuditService.log({
        actor: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'PICKUP_COLLECTION_VERIFIED',
        entityType: 'Pickup',
        entityId: pickup._id,
        newState: { status: 'COLLECTED', collectedAt: pickup.collectedAt },
      });

      return res.json({
        success: true,
        message: 'Pickup verification successful! Food is marked as COLLECTED and in transit.',
        pickup: sanitizePickupForUser(pickup, req.user._id, req.user.role),
      });
    } else if (handoverType === 'delivery') {
      if (pickup.status !== 'COLLECTED' && pickup.status !== 'ARRIVED_AT_RECIPIENT') {
        return res.status(400).json({
          success: false,
          message: `Cannot verify delivery before food has been collected from donor (Current status: ${pickup.status})`,
        });
      }

      const isValid = CodeService.verifyCode(cleanCode, pickup.deliveryVerificationCodeHash);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Recipient Delivery Code. Please verify the 6-digit code shown on the NGO recipient screen.',
        });
      }

      // Valid delivery! Transition all states to completion
      const completedTime = new Date();
      pickup.status = 'DELIVERED';
      pickup.deliveredAt = completedTime;
      pickup.timeline.push({
        status: 'DELIVERED',
        timestamp: completedTime,
        updatedBy: req.user._id,
        notes: notes || 'Recipient verification code confirmed. Surplus food safely delivered and accepted.',
        simulatedLocation: {
          lng: pickup.deliveryAddress.coordinates[0],
          lat: pickup.deliveryAddress.coordinates[1],
        },
      });

      await pickup.save();
      await Donation.findByIdAndUpdate(pickup.donation._id, { status: 'DELIVERED' });
      await DonationRequest.findByIdAndUpdate(pickup.donationRequest._id, { status: 'COMPLETED' });

      // Increment volunteer completed deliveries
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'volunteerProfile.completedDeliveriesCount': 1 },
      });

      // Notify parties
      await NotificationService.notify({
        recipient: pickup.donor,
        type: 'DELIVERED',
        title: 'Mission Complete: Food Delivered!',
        message: `Your donation of ${pickup.donation.foodTitle} has been safely delivered to the community!`,
        relatedPickup: pickup._id,
      });

      await NotificationService.notify({
        recipient: pickup.recipientUser,
        type: 'DELIVERED',
        title: 'Delivery Receipt Confirmed',
        message: `Thank you for confirming receipt of ${pickup.donation.foodTitle}.`,
        relatedPickup: pickup._id,
      });

      await AuditService.log({
        actor: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'DELIVERY_HANDOVER_VERIFIED',
        entityType: 'Pickup',
        entityId: pickup._id,
        newState: { status: 'DELIVERED', deliveredAt: completedTime },
      });

      return res.json({
        success: true,
        message: 'Delivery verified successfully! Impact recorded in platform analytics.',
        pickup: sanitizePickupForUser(pickup, req.user._id, req.user.role),
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid handoverType. Must be either 'pickup' or 'delivery'.",
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Report delivery discrepancy
// @route   POST /api/pickups/:id/discrepancy
// @access  Private (Recipient or Volunteer)
exports.reportDiscrepancy = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    pickup.discrepancyReport = {
      reported: true,
      notes: notes || 'Discrepancy reported regarding condition or quantity',
      reportedBy: req.user._id,
      reportedAt: new Date(),
    };

    await pickup.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'DISCREPANCY_REPORTED',
      entityType: 'Pickup',
      entityId: pickup._id,
      metadata: { notes },
    });

    res.json({
      success: true,
      message: 'Discrepancy logged for administrative review',
      pickup: sanitizePickupForUser(pickup, req.user._id, req.user.role),
    });
  } catch (error) {
    next(error);
  }
};
