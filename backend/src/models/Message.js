const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
    },
    donationRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DonationRequest',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['donor', 'recipient', 'volunteer', 'admin'],
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ donation: 1, createdAt: 1 });
messageSchema.index({ donationRequest: 1 });

module.exports = mongoose.model('Message', messageSchema);
