const express = require('express'); 
const { addToCart, fetchCartItems, updateCartItemQuantity, deleteCartItem, clearCart } = require('../../controllers/shop/cartController');

const router = express.Router();

router.post('/add', addToCart);
router.get('/get/:userId', fetchCartItems);
router.put('/update-cart', updateCartItemQuantity);
router.delete('/:userId/:productId', deleteCartItem);

// Multiple methods to clear the cart for maximum compatibility
// DELETE request with userId in URL
router.delete('/clear/:userId', clearCart);

// POST request with userId in body - ensures compatibility with all browsers/clients
router.post('/clear', clearCart);

// GET request for simpler clearing (useful for redirects, etc)
router.get('/clear/:userId', clearCart);

module.exports = router;