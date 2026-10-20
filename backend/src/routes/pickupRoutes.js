const express = require('express');
const router = express.Router();
const {
  getPickups,
  getPickupById,
  assignVolunteer,
  updatePickupStatus,
  verifyHandover,
  reportDiscrepancy,
} = require('../controllers/pickupController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(protect, getPickups);
router.route('/:id').get(protect, getPickupById);

// Volunteer assigns himself/herself
router.post('/:id/assign', protect, authorize('volunteer', 'admin'), assignVolunteer);

// Volunteer updates progress status
router.patch('/:id/status', protect, authorize('volunteer', 'admin'), updatePickupStatus);

// Secure OTP verification (pickup or delivery)
router.post('/:id/verify-handover', protect, authorize('volunteer', 'admin'), verifyHandover);

// Discrepancy report
router.post('/:id/discrepancy', protect, reportDiscrepancy);

module.exports = router;
