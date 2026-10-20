const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonationById,
  cancelDonation,
} = require('../controllers/donationController');
const { createRequest } = require('../controllers/requestController');
const { protect, authorize, requireVerifiedRecipient } = require('../middleware/auth');

router
  .route('/')
  .post(protect, authorize('donor', 'admin'), createDonation)
  .get(getDonations);

router.route('/:id').get(getDonationById);

router.post('/:id/cancel', protect, authorize('donor', 'admin'), cancelDonation);

// Recipient claims a donation
router.post(
  '/:id/requests',
  protect,
  authorize('recipient', 'admin'),
  requireVerifiedRecipient,
  createRequest
);

module.exports = router;
