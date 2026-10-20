const express = require('express');
const router = express.Router();
const { getMatchesForDonation } = require('../controllers/matchingController');
const { protect } = require('../middleware/auth');

router.get('/:donationId', protect, getMatchesForDonation);

module.exports = router;
