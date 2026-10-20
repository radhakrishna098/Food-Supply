const express = require('express');
const router = express.Router();
const {
  getPendingVerifications,
  reviewVerification,
  getAuditLogs,
  getAllUsers,
  updateUserStatus,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes here strictly protected for Admin
router.use(protect, authorize('admin'));

router.get('/verifications', getPendingVerifications);
router.patch('/organizations/:id/verification', reviewVerification);
router.get('/audit-logs', getAuditLogs);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

module.exports = router;
