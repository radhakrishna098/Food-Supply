const mongoose = require('mongoose');

const donationRequestSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
    },
    recipientOrg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedQuantity: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: [0.1, 'Requested quantity must be positive'],
    },
    requestedServings: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
    },
    matchScoreSnapshot: {
      totalScore: { type: Number, default: 0 },
      proximityScore: { type: Number, default: 0 },
      capacityScore: { type: Number, default: 0 },
      timeScore: { type: Number, default: 0 },
      dietaryScore: { type: Number, default: 0 },
      needScore: { type: Number, default: 0 },
      pickupScore: { type: Number, default: 0 },
      distanceKm: { type: Number, default: 0 },
      estimatedTransitMinutes: { type: Number, default: 0 },
      reasons: [{ type: String }],
    },
    donorNotes: {
      type: String,
      default: '',
    },
    recipientNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

donationRequestSchema.index({ donation: 1, recipientOrg: 1 });
donationRequestSchema.index({ status: 1 });
donationRequestSchema.index({ requestedBy: 1 });

module.exports = mongoose.model('DonationRequest', donationRequestSchema);
