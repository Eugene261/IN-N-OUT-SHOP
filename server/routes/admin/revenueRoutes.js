const express = require('express');
const { 
    getAdminRevenue, 
    getAdminOrders,
    getAdminRevenueByTime,
    getAllAdminRevenueData
} = require('../../controllers/admin/revenueController.js');
const { verifyToken, isAdmin } = require('../../Middleware/auth');

const router = express.Router();

// Apply authentication middleware to individual routes
// Get revenue statistics for the logged-in admin
router.get('/stats', verifyToken, isAdmin, getAdminRevenue);

// Get orders that contain products created by the logged-in admin
router.get('/orders', verifyToken, isAdmin, getAdminOrders);

// Get all revenue data at once (daily, weekly, monthly, yearly)
router.get('/all/revenue-data', verifyToken, isAdmin, getAllAdminRevenueData);

// Get time-based revenue data for the logged-in admin
router.get('/:timeUnit', verifyToken, isAdmin, getAdminRevenueByTime);

module.exports = router;
