const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const AuditService = require('../services/auditService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'foodloop_dev_jwt_secret_key_random_long_token_2024', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      organizationName,
      orgType,
      formattedAddress,
      pinCode,
      postalCode,
      coordinates,
      maxCapacity,
      acceptedCategories,
      dietaryPreferences,
      vehicleType,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required fields',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Determine initial account status
    // Recipient NGOs require admin verification
    const accountStatus = role === 'recipient' ? 'pending' : 'active';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone || '',
      accountStatus,
      volunteerProfile:
        role === 'volunteer'
          ? {
              vehicleType: vehicleType || 'car',
              isAvailable: true,
              currentLocation: {
                type: 'Point',
                coordinates: coordinates || [77.2090, 28.6139],
              },
            }
          : undefined,
    });

    let organization = null;
    // Create linked Organization if role is recipient or donor
    if ((role === 'recipient' || role === 'donor') && organizationName) {
      organization = await Organization.create({
        owner: user._id,
        name: organizationName,
        type: orgType || (role === 'donor' ? 'restaurant' : 'shelter'),
        verificationStatus: role === 'recipient' ? 'pending' : 'verified',
        address: {
          formattedAddress: formattedAddress || 'Connaught Place, New Delhi',
          pinCode: pinCode || postalCode || '110001',
          postalCode: pinCode || postalCode || '110001',
        },
        location: {
          type: 'Point',
          coordinates: coordinates || [77.2197, 28.6328],
        },
        maxDailyCapacityServings: maxCapacity || (role === 'recipient' ? 100 : 500),
        acceptedFoodCategories: acceptedCategories || [
          'prepared_meals',
          'packaged_groceries',
          'bakery',
        ],
        dietaryPreferences: dietaryPreferences || ['vegetarian', 'vegan'],
        contactPhone: phone || '',
        contactEmail: email,
      });
    }

    await AuditService.log({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      metadata: { role, organizationCreated: !!organization },
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        phone: user.phone,
        volunteerProfile: user.volunteerProfile,
      },
      organization,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by administrators',
      });
    }

    const organization = await Organization.findOne({ owner: user._id });
    const token = generateToken(user._id);

    await AuditService.log({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        phone: user.phone,
        volunteerProfile: user.volunteerProfile,
      },
      organization,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user & org
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const organization = await Organization.findOne({ owner: user._id });

    res.json({
      success: true,
      user,
      organization,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, volunteerProfile } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (volunteerProfile && user.role === 'volunteer') {
      user.volunteerProfile = { ...user.volunteerProfile.toObject(), ...volunteerProfile };
    }

    await user.save();

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
