const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['donor', 'recipient', 'volunteer', 'admin'],
      required: [true, 'Role is required'],
    },
    accountStatus: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected'],
      default: function () {
        return this.role === 'recipient' ? 'pending' : 'active';
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    // Optional volunteer-specific attributes
    volunteerProfile: {
      vehicleType: {
        type: String,
        enum: ['bike', 'car', 'van', 'on_foot', 'scooter'],
        default: 'car',
      },
      maxCapacityKg: {
        type: Number,
        default: 25,
      },
      serviceRadiusKm: {
        type: Number,
        default: 15,
      },
      isAvailable: {
        type: Boolean,
        default: true,
      },
      currentLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [77.2090, 28.6139],
        },
      },
      completedDeliveriesCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Geo index for volunteer location
userSchema.index({ 'volunteerProfile.currentLocation': '2dsphere' });

// Pre-save password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
