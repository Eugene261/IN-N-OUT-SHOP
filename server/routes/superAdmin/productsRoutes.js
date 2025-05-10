const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../controllers/authController.js');
const { 
  getAllProducts, 
  getProductsByAdmin, 
  getProductStats,
  getFeaturedProducts
} = require('../../controllers/superAdmin/productsController.js');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all products
router.get('/all', getAllProducts);

// Get products by admin
router.get('/admin/:adminId', getProductsByAdmin);

// Get product statistics
router.get('/stats', getProductStats);

// Get featured products (bestsellers and new arrivals)
router.get('/featured', getFeaturedProducts);

module.exports = router;
