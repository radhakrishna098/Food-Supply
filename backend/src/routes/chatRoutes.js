const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.route('/:donationId')
  .get(protect, getMessages)
  .post(protect, sendMessage);

module.exports = router;
