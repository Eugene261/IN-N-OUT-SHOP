const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../controllers/authController.js');
const { 
  toggleProductBestseller,
  toggleProductNewArrival,
  getFeatureImages,
  addFeatureImage,
  deleteFeatureImage
} = require('../../controllers/admin/productsController.js');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Feature image routes
router.get('/feature-images', getFeatureImages);
router.post('/feature-images', addFeatureImage);
router.delete('/feature-images/:id', deleteFeatureImage);

// Product feature routes
router.put('/toggle-bestseller/:productId', toggleProductBestseller);
router.put('/toggle-new-arrival/:productId', toggleProductNewArrival);

module.exports = router;
