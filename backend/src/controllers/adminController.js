const Organization = require('../models/Organization');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Pickup = require('../models/Pickup');
const AuditLog = require('../models/AuditLog');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');

// @desc    Get pending verification applications
// @route   GET /api/admin/verifications
// @access  Private (Admin only)
exports.getPendingVerifications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { verificationStatus: status } : { verificationStatus: 'pending' };

    const organizations = await Organization.find(filter)
      .populate('owner', 'name email phone createdAt')
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

// @desc    Review verification application (Approve / Reject)
// @route   PATCH /api/admin/organizations/:id/verification
// @access  Private (Admin only)
exports.reviewVerification = async (req, res, next) => {
  try {
    const { decision, rejectionReason } = req.body; // decision: 'verified' | 'rejected' | 'suspended'
    const org = await Organization.findById(req.params.id).populate('owner');

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    if (!['verified', 'rejected', 'suspended'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'verified', 'rejected', or 'suspended'",
      });
    }

    const previousStatus = org.verificationStatus;
    org.verificationStatus = decision;
    org.rejectionReason = decision === 'rejected' ? rejectionReason || 'Documentation insufficient' : '';
    org.verifiedAt = decision === 'verified' ? new Date() : undefined;
    org.verifiedBy = req.user._id;

    await org.save();

    // If verified, activate recipient user account
    if (org.owner) {
      const userStatus = decision === 'verified' ? 'active' : decision === 'rejected' ? 'rejected' : 'suspended';
      await User.findByIdAndUpdate(org.owner._id, { accountStatus: userStatus });

      await NotificationService.notify({
        recipient: org.owner._id,
        type: 'ADMIN_ALERT',
        title: decision === 'verified' ? 'Organization Verified!' : 'Verification Application Update',
        message:
          decision === 'verified'
            ? `Congratulations! ${org.name} has been verified as an eligible food rescue recipient organization.`
            : `Your verification status has been updated to '${decision}': ${org.rejectionReason}`,
      });
    }

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ORGANIZATION_VERIFICATION_REVIEW',
      entityType: 'Organization',
      entityId: org._id,
      previousState: { verificationStatus: previousStatus },
      newState: { verificationStatus: decision, rejectionReason: org.rejectionReason },
    });

    res.json({
      success: true,
      message: `Organization verification status updated to '${decision}'`,
      organization: org,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit logs with filtering & pagination
// @route   GET /api/admin/audit-logs
// @access  Private (Admin only)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { entityType, action, limit = 100, page = 1 } = req.query;
    const filter = {};

    if (entityType) filter.entityType = entityType;
    if (action) filter.action = action;

    const skip = (Number(page) - 1) * Number(limit);

    const logs = await AuditLog.find(filter)
      .populate('actor', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (User management)
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.accountStatus = status;

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (suspend / reactivate)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { accountStatus } = req.body;
    if (!['active', 'suspended', 'pending', 'rejected'].includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account status',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = accountStatus;
    await user.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_STATUS_UPDATED',
      entityType: 'User',
      entityId: user._id,
      previousState: { accountStatus: previousStatus },
      newState: { accountStatus },
    });

    res.json({
      success: true,
      message: `User status changed to ${accountStatus}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};
