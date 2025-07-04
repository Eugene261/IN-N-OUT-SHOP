const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin } = require('../../Middleware/auth.js');
const { getAdminRevenueByTime } = require('../../controllers/superAdmin/revenueController.js');

// Apply auth middleware and super admin check to all routes
router.use(verifyToken);
router.use(isSuperAdmin);

// OPTIMIZED: Add timeout middleware for revenue endpoints
router.use((req, res, next) => {
  // Set a 25-second timeout for revenue queries (less than client's 30s timeout)
  req.setTimeout(25000, () => {
    console.error('⏰ Revenue API timeout - query took too long');
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout - query took too long to execute'
      });
    }
  });
  next();
});

// Get admin revenue by time period
router.get('/by-time', getAdminRevenueByTime);

module.exports = router;
