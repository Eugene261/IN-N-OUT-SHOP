const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../Middleware/auth');

// Profile management routes
router.get('/profile', verifyToken, userController.getUserProfile);
router.get('/profile/:userId', verifyToken, userController.getUserProfile);
router.put('/profile', verifyToken, userController.updateUserProfile);
router.put('/profile/:userId', verifyToken, userController.updateUserProfile);
router.post('/change-password', verifyToken, userController.changePassword);
router.post('/change-password/:userId', verifyToken, userController.changePassword);

// Admin routes - User management
router.get('/admin/users', verifyToken, userController.getAllUsers);
router.put('/admin/users/:userId/role', verifyToken, userController.updateUserRole);
router.patch('/admin/users/:userId/status', verifyToken, userController.toggleUserStatus);
router.delete('/admin/users/:userId', verifyToken, userController.deleteUser);

// Update user settings route
router.patch('/:userId/settings', verifyToken, userController.updateUserSettings);

// Base region routes (deprecated, use shipping settings instead)
router.patch('/settings/base-region', verifyToken, userController.updateBaseRegion);
router.get('/settings/base-region', verifyToken, userController.getBaseRegion);

// Shipping settings routes
router.get('/settings/shipping', verifyToken, userController.getVendorShippingSettings);
router.get('/:userId/settings/shipping', verifyToken, userController.getVendorShippingSettings);

module.exports = router;