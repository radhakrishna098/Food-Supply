const Organization = require('../models/Organization');
const AuditService = require('../services/auditService');

// @desc    Get logged in user's organization profile
// @route   GET /api/organizations/me
// @access  Private
exports.getMyOrg = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ owner: req.user._id });
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found',
      });
    }

    res.json({
      success: true,
      organization: org,
      remainingCapacity: org.getRemainingCapacity(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged in user's organization
// @route   PATCH /api/organizations/me
// @access  Private
exports.updateMyOrg = async (req, res, next) => {
  try {
    let org = await Organization.findOne({ owner: req.user._id });

    if (!org) {
      // Create if doesn't exist
      org = new Organization({
        owner: req.user._id,
        name: req.body.name || `${req.user.name}'s Organization`,
        type: req.body.type || (req.user.role === 'donor' ? 'restaurant' : 'shelter'),
        verificationStatus: req.user.role === 'recipient' ? 'pending' : 'verified',
        address: { formattedAddress: req.body.formattedAddress || 'New Delhi, India' },
        location: {
          type: 'Point',
          coordinates: req.body.coordinates || [77.2090, 28.6139],
        },
      });
    }

    const updatableFields = [
      'name',
      'type',
      'maxDailyCapacityServings',
      'acceptedFoodCategories',
      'dietaryPreferences',
      'operatingHours',
      'serviceRadiusKm',
      'hasRefrigeration',
      'hasVehicle',
      'contactPhone',
      'contactEmail',
      'description',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        org[field] = req.body[field];
      }
    });

    if (req.body.formattedAddress) {
      org.address.formattedAddress = req.body.formattedAddress;
    }
    if (req.body.coordinates) {
      org.location.coordinates = req.body.coordinates;
    }

    await org.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ORGANIZATION_UPDATED',
      entityType: 'Organization',
      entityId: org._id,
    });

    res.json({
      success: true,
      organization: org,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit verification documents for an NGO
// @route   POST /api/organizations/me/verification
// @access  Private (Recipient NGO)
exports.submitVerification = async (req, res, next) => {
  try {
    const { docType, docNumber, notes } = req.body;
    let org = await Organization.findOne({ owner: req.user._id });

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found. Please create organization first.',
      });
    }

    org.verificationDocuments.push({
      docType: docType || 'Government Registration / 80G Certificate',
      docNumber: docNumber || 'REG-PENDING-2024',
      fileUrl: notes || '',
    });
    org.verificationStatus = 'pending';
    await org.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'VERIFICATION_SUBMITTED',
      entityType: 'Organization',
      entityId: org._id,
      metadata: { docType, docNumber },
    });

    res.json({
      success: true,
      message: 'Verification application submitted successfully. Platform administrators will review your credentials.',
      organization: org,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all organizations (Directory / Map)
// @route   GET /api/organizations
// @access  Public
exports.getAllOrgs = async (req, res, next) => {
  try {
    const { type, verifiedOnly } = req.query;
    const filter = { isActive: true };

    if (type) filter.type = type;
    if (verifiedOnly === 'true') filter.verificationStatus = 'verified';

    const organizations = await Organization.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: organizations.length,
      organizations,
    });
  } catch (error) {
    next(error);
  }
};
