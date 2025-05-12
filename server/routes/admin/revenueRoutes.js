const express = require('express');
const { 
    getAdminRevenue, 
    getAdminOrders,
    getAdminRevenueByTime,
    getAllAdminRevenueData
} = require('../../Controllers/admin/revenueController.js');
const { isAuthenticated, isAdmin } = require('../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all admin revenue routes
router.use(isAuthenticated);
router.use(isAdmin);

// Get revenue statistics for the logged-in admin
router.get('/stats', getAdminRevenue);

// Get orders that contain products created by the logged-in admin
router.get('/orders', getAdminOrders);

// Get all revenue data at once (daily, weekly, monthly, yearly)
router.get('/all/revenue-data', getAllAdminRevenueData);

// Get time-based revenue data for the logged-in admin
router.get('/:timeUnit', getAdminRevenueByTime);

module.exports = router;
