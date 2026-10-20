const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'DONATION_MATCH',
        'REQUEST_RECEIVED',
        'REQUEST_ACCEPTED',
        'REQUEST_REJECTED',
        'VOLUNTEER_ASSIGNED',
        'PICKUP_UPDATE',
        'COLLECTED',
        'DELIVERED',
        'DEADLINE_APPROACHING',
        'EXPIRATION',
        'ADMIN_ALERT',
        'NEW_MESSAGE',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedDonation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
    },
    relatedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DonationRequest',
    },
    relatedPickup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pickup',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
