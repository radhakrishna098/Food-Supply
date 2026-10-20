const express = require('express');
const router = express.Router();
const { getImpactOverview } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// Optional auth for user-specific stats
router.get('/overview', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, getImpactOverview);

module.exports = router;
