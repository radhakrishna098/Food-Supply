const Message = require('../models/Message');
const Donation = require('../models/Donation');
const DonationRequest = require('../models/DonationRequest');
const Pickup = require('../models/Pickup');
const NotificationService = require('../services/notificationService');

// @desc    Get messages for a donation thread
// @route   GET /api/chat/:donationId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    const messages = await Message.find({ donation: donationId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    // Mark messages as read by current user
    await Message.updateMany(
      {
        donation: donationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    );

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message for a donation coordination thread
// @route   POST /api/chat/:donationId
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const { text, donationRequestId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty',
      });
    }

    const donation = await Donation.findById(donationId).populate('donor');
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    const message = await Message.create({
      donation: donation._id,
      donationRequest: donationRequestId || undefined,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: text.trim(),
      readBy: [req.user._id],
    });

    // Notify other parties involved in the rescue
    try {
      // 1. Notify donor if sender is not the donor
      if (donation.donor && donation.donor._id.toString() !== req.user._id.toString()) {
        await NotificationService.notify({
          recipient: donation.donor._id,
          type: 'NEW_MESSAGE',
          title: `New message on ${donation.foodTitle}`,
          message: `${req.user.name} (${req.user.role}): "${text.length > 60 ? text.substring(0, 60) + '...' : text}"`,
          relatedDonation: donation._id,
        });
      }

      // 2. Notify recipient organizations associated with active/pending requests
      const requests = await DonationRequest.find({
        donation: donation._id,
        status: { $in: ['ACCEPTED', 'PENDING'] },
      }).populate('recipientOrg');

      for (const reqItem of requests) {
        const recipientUserId = reqItem.recipientOrg?.owner || reqItem.requestedBy;
        if (
          recipientUserId &&
          recipientUserId.toString() !== req.user._id.toString()
        ) {
          await NotificationService.notify({
            recipient: recipientUserId,
            type: 'NEW_MESSAGE',
            title: `New message on ${donation.foodTitle}`,
            message: `${req.user.name}: "${text.length > 60 ? text.substring(0, 60) + '...' : text}"`,
            relatedDonation: donation._id,
            relatedRequest: reqItem._id,
          });
        }
      }

      // 3. Notify assigned volunteer if exists
      const pickup = await Pickup.findOne({
        donation: donation._id,
        status: { $in: ['CLAIMED', 'IN_TRANSIT', 'COLLECTED'] },
      });
      if (pickup && pickup.volunteer && pickup.volunteer.toString() !== req.user._id.toString()) {
        await NotificationService.notify({
          recipient: pickup.volunteer,
          type: 'NEW_MESSAGE',
          title: `Pickup coordination for ${donation.foodTitle}`,
          message: `${req.user.name}: "${text.length > 60 ? text.substring(0, 60) + '...' : text}"`,
          relatedDonation: donation._id,
          relatedPickup: pickup._id,
        });
      }
    } catch (notifErr) {
      console.error('[Chat Notification Warning]:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
};
