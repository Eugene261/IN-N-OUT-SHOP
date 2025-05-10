const express = require('express');
const { getAdminRevenue, getAdminOrders } = require('../../controllers/admin/revenueController.js');
const { isAuthenticated, isAdmin } = require('../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all admin revenue routes
router.use(isAuthenticated);
router.use(isAdmin);

// Get revenue statistics for the logged-in admin
router.get('/stats', getAdminRevenue);

// Get orders that contain products created by the logged-in admin
router.get('/orders', getAdminOrders);

module.exports = router;
