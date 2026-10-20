const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema(
  {
    donationRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DonationRequest',
      required: true,
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientOrg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: [
        'ASSIGNED',
        'ACCEPTED_BY_VOLUNTEER',
        'EN_ROUTE',
        'ARRIVED_AT_DONOR',
        'COLLECTED',
        'ARRIVED_AT_RECIPIENT',
        'DELIVERED',
        'CANCELLED',
        'FAILED',
      ],
      default: 'ASSIGNED',
    },
    // Cryptographic hashes of 6-digit confirmation codes
    pickupVerificationCodeHash: {
      type: String,
      required: true,
    },
    deliveryVerificationCodeHash: {
      type: String,
      required: true,
    },
    // Plaintext codes are strictly stored for authorized role delivery
    // pickupCode: provided only to the Donor to give to the Volunteer at collection
    pickupCode: {
      type: String,
      required: true,
    },
    // deliveryCode: provided only to the Recipient NGO to give to the Volunteer at delivery
    deliveryCode: {
      type: String,
      required: true,
    },
    pickupAddress: {
      formattedAddress: { type: String, required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    deliveryAddress: {
      formattedAddress: { type: String, required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String, default: '' },
        simulatedLocation: {
          lat: Number,
          lng: Number,
        },
      },
    ],
    discrepancyReport: {
      reported: { type: Boolean, default: false },
      notes: { type: String, default: '' },
      reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reportedAt: { type: Date },
    },
    collectedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

pickupSchema.index({ status: 1 });
pickupSchema.index({ assignedVolunteer: 1 });
pickupSchema.index({ donor: 1 });
pickupSchema.index({ recipientUser: 1 });

module.exports = mongoose.model('Pickup', pickupSchema);
