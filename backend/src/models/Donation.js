const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    donorOrg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    donorType: {
      type: String,
      enum: ['restaurant', 'individual', 'shop', 'event_organizer', 'hotel', 'caterer', 'bakery', 'other'],
      default: 'restaurant',
    },
    pinCode: {
      type: String,
      required: [true, 'Indian 6-digit PIN code is required'],
      trim: true,
      default: '110001',
      match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit Indian PIN code'],
    },
    foodTitle: {
      type: String,
      required: [true, 'Food title is required'],
      trim: true,
    },
    category: {
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
      required: [true, 'Food category is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.1, 'Quantity must be positive'],
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['portions', 'kg', 'boxes', 'liters', 'trays', 'servings'],
      default: 'portions',
    },
    estimatedServings: {
      type: Number,
      required: [true, 'Estimated servings count is required'],
      min: [1, 'Must serve at least 1 person'],
    },
    dietaryClassification: [
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
          'non_vegetarian',
        ],
        default: ['vegetarian'],
      },
    ],
    allergenInfo: [
      {
        type: String,
        trim: true,
      },
    ],
    preparationTime: {
      type: Date,
      required: [true, 'Preparation timestamp is required'],
      validate: {
        validator: function (v) {
          // Cannot be in the future (with 5 min grace for clock drift)
          return v <= new Date(Date.now() + 5 * 60 * 1000);
        },
        message: 'Preparation time cannot be in the future',
      },
    },
    collectionWindow: {
      startTime: {
        type: Date,
        required: [true, 'Collection start time is required'],
      },
      deadline: {
        type: Date,
        required: [true, 'Collection deadline is required'],
        validate: {
          validator: function (v) {
            return this.collectionWindow ? v > this.collectionWindow.startTime : true;
          },
          message: 'Collection deadline must be after start time',
        },
      },
    },
    storageAndHandling: {
      storageType: {
        type: String,
        enum: ['room_temperature', 'refrigerated', 'frozen', 'hot_holding'],
        required: [true, 'Storage condition is required'],
      },
      handlingInstructions: {
        type: String,
        default: '',
      },
      packagingType: {
        type: String,
        default: 'Food-grade containers',
      },
    },
    safetyDeclaration: {
      isSafeAndEdible: {
        type: Boolean,
        required: [true, 'Food safety declaration is mandatory'],
      },
      storedAtSafeTemperature: {
        type: Boolean,
        required: [true, 'Temperature declaration is mandatory'],
      },
      preparedWithCleanUtensils: {
        type: Boolean,
        required: [true, 'Hygiene declaration is mandatory'],
      },
      declaredBy: {
        type: String,
        required: true,
      },
      declaredAt: {
        type: Date,
        default: Date.now,
      },
    },
    pickupAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      formattedAddress: { type: String, required: [true, 'Pickup address is required'] },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Pickup geographic coordinates are required'],
      },
    },
    specialCollectionInstructions: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'AVAILABLE',
        'REQUESTED',
        'ACCEPTED',
        'PICKUP_SCHEDULED',
        'PICKED_UP',
        'DELIVERED',
        'PARTIALLY_CLAIMED',
        'CANCELLED',
        'EXPIRED',
        'DISPUTED',
      ],
      default: 'AVAILABLE',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    requiresManualReview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

donationSchema.index({ location: '2dsphere' });
donationSchema.index({ status: 1, 'collectionWindow.deadline': 1 });
donationSchema.index({ donor: 1 });
donationSchema.index({ pinCode: 1 });

// Helper to check if donation is currently active & not expired
donationSchema.methods.isClaimable = function () {
  const now = new Date();
  return (
    (this.status === 'AVAILABLE' || this.status === 'PARTIALLY_CLAIMED') &&
    this.remainingQuantity > 0 &&
    new Date(this.collectionWindow.deadline) > now
  );
};

module.exports = mongoose.model('Donation', donationSchema);
