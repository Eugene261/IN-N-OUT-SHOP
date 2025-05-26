const express = require('express');
const { 
    getFilteredProducts, 
    getProductDetails, 
    fetchBestsellerProducts, 
    fetchNewArrivalProducts, 
    toggleBestseller, 
    toggleNewArrival,
    getSimilarProducts,
    getAvailableShops,
    getDebugSubcategories,
    createTestProducts 
} = require('../../controllers/shop/productController');
const { authMiddleware } = require('../../controllers/authController.js');

const router = express.Router()

router.get('/get' , getFilteredProducts);
router.get('/get/:id' , getProductDetails);
router.get('/bestsellers', fetchBestsellerProducts);
router.get('/new-arrivals', fetchNewArrivalProducts);
router.get('/similar/:id', getSimilarProducts);
router.get('/available-shops', getAvailableShops);
router.get('/debug-subcategories', getDebugSubcategories);
// router.post('/create-test-products', createTestProducts); // Disabled for production
router.patch('/toggle-bestseller/:id', authMiddleware, toggleBestseller);
router.patch('/toggle-new-arrival/:id', authMiddleware, toggleNewArrival);

module.exports = router;