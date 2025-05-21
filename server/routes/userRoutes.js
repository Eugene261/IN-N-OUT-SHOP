const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../Middleware/auth');

// Update user settings route
router.patch('/:userId/settings', verifyToken, userController.updateUserSettings);

// Base region routes (deprecated, use shipping settings instead)
router.patch('/settings/base-region', verifyToken, userController.updateBaseRegion);
router.get('/settings/base-region', verifyToken, userController.getBaseRegion);

// Shipping settings routes
router.get('/settings/shipping', verifyToken, userController.getVendorShippingSettings);
router.get('/:userId/settings/shipping', verifyToken, userController.getVendorShippingSettings);

module.exports = router;