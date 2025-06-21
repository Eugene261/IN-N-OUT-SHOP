const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist, migrateGuestWishlist } = require('../controllers/wishlistController');

// Add product to wishlist (supports both authenticated and guest users)
router.post('/add', addToWishlist);

// Remove product from wishlist (supports both authenticated and guest users)
router.delete('/remove/:userId/:productId', removeFromWishlist);

// Guest specific remove route (expected by frontend)
router.delete('/remove/guest/:productId', removeFromWishlist);

// Get user's wishlist (supports both authenticated and guest users)
router.get('/:userId', getWishlist);

// Guest specific get route (expected by frontend)
router.get('/guest', getWishlist);

// Migrate guest wishlist to user account when user logs in
router.post('/migrate', migrateGuestWishlist);

module.exports = router;
