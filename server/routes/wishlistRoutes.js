const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

// Add product to wishlist
router.post('/add', wishlistController.addToWishlist);

// Remove product from wishlist
router.delete('/remove/:userId/:productId', wishlistController.removeFromWishlist);

// Get user's wishlist
router.get('/:userId', wishlistController.getWishlist);

module.exports = router;
