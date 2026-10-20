const express = require('express');
const router = express.Router();
const {
  getMyOrg,
  updateMyOrg,
  submitVerification,
  getAllOrgs,
} = require('../controllers/orgController');
const { protect } = require('../middleware/auth');

router.get('/', getAllOrgs);
router.get('/me', protect, getMyOrg);
router.patch('/me', protect, updateMyOrg);
router.post('/me/verification', protect, submitVerification);

module.exports = router;
