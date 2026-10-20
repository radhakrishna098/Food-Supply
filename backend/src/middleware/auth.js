const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Protect routes - JWT verification
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: authentication token is missing',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'foodloop_dev_jwt_secret_key_random_long_token_2024');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact platform administrators.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: token is invalid or expired',
    });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Ensure Recipient NGO is verified before making claims
exports.requireVerifiedRecipient = async (req, res, next) => {
  if (req.user.role !== 'recipient') {
    return next();
  }

  const org = await Organization.findOne({ owner: req.user._id });
  if (!org) {
    return res.status(400).json({
      success: false,
      message: 'Organization profile not found. Please create your organization profile first.',
    });
  }

  if (org.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: `Organization is currently '${org.verificationStatus}'. Only verified organizations can claim surplus food donations.`,
      verificationStatus: org.verificationStatus,
    });
  }

  req.userOrg = org;
  next();
};
