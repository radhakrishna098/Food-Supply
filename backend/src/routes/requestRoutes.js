const express = require('express');
const router = express.Router();
const {
  acceptRequest,
  rejectRequest,
  getMyRequests,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, getMyRequests);
router.patch('/:id/accept', protect, authorize('donor', 'admin'), acceptRequest);
router.patch('/:id/reject', protect, authorize('donor', 'admin'), rejectRequest);

module.exports = router;
