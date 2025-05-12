const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../controllers/authController.js');
const { getAdminRevenueByTime } = require('../../Controllers/superAdmin/revenueController.js');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get admin revenue by time period
router.get('/by-time', getAdminRevenueByTime);

module.exports = router;
