const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../controllers/authController.js');
const { 
  getAllOrders, 
  getOrdersByAdmin, 
  getOrderStats 
} = require('../../controllers/superAdmin/ordersController.js');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all orders
router.get('/all', getAllOrders);

// Get orders by admin
router.get('/admin/:adminId', getOrdersByAdmin);

// Get order statistics
router.get('/stats', getOrderStats);

module.exports = router;
