const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'shelter',
        'orphanage',
        'old_age_home',
        'community_kitchen',
        'ngo',
        'food_bank',
        'religious_charity',
        'restaurant',
        'shop',
        'supermarket',
        'bakery',
        'caterer',
        'hotel',
        'individual',
        'other',
      ],
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending',
    },
    verificationDocuments: [
      {
        docType: { type: String, default: 'Registration / Tax ID' },
        docNumber: { type: String, default: '' },
        fileUrl: { type: String, default: '' },
      },
    ],
    rejectionReason: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      pinCode: {
        type: String,
        required: [true, 'Indian 6-digit PIN code is required'],
        trim: true,
        default: '110001',
        match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit Indian PIN code'],
      },
      formattedAddress: { type: String, required: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    // Daily intake capacity in servings
    maxDailyCapacityServings: {
      type: Number,
      required: true,
      default: 100,
    },
    currentDailyClaimedServings: {
      type: Number,
      default: 0,
    },
    capacityResetDate: {
      type: Date,
      default: Date.now,
    },
    acceptedFoodCategories: [
      {
        type: String,
        enum: [
          'prepared_meals',
          'packaged_groceries',
          'fruits_vegetables',
          'bakery',
          'dairy_refrigerated',
          'beverages',
          'canned_goods',
          'frozen',
        ],
      },
    ],
    dietaryPreferences: [
      {
        type: String,
        enum: [
          'vegetarian',
          'vegan',
          'halal',
          'kosher',
          'gluten_free',
          'nut_free',
          'dairy_free',
          'any',
        ],
      },
    ],
    operatingHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '21:00' },
      daysOpen: {
        type: [String],
        default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    },
    serviceRadiusKm: {
      type: Number,
      default: 15,
      min: 1,
      max: 100,
    },
    hasRefrigeration: {
      type: Boolean,
      default: true,
    },
    hasVehicle: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    contactPhone: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial 2dsphere index for location queries
organizationSchema.index({ location: '2dsphere' });
organizationSchema.index({ verificationStatus: 1, isActive: 1 });
organizationSchema.index({ 'address.pinCode': 1 });

// Helper to check if reset is needed for the day
organizationSchema.methods.getRemainingCapacity = function () {
  const now = new Date();
  const resetDate = new Date(this.capacityResetDate || now);
  // If calendar day changed, reset daily claimed servings
  if (
    now.getDate() !== resetDate.getDate() ||
    now.getMonth() !== resetDate.getMonth() ||
    now.getFullYear() !== resetDate.getFullYear()
  ) {
    this.currentDailyClaimedServings = 0;
    this.capacityResetDate = now;
  }
  return Math.max(0, this.maxDailyCapacityServings - (this.currentDailyClaimedServings || 0));
};

module.exports = mongoose.model('Organization', organizationSchema);
