const express = require('express'); 
const { addToCart, fetchCartItems, updateCartItemQuantity, deleteCartItem, clearCart } = require('../../controllers/shop/cartController');

const router = express.Router();

router.post('/add', addToCart);
router.get('/get/:userId', fetchCartItems);
router.put('/update-cart', updateCartItemQuantity);
router.delete('/:userId/:productId' , deleteCartItem);
router.delete('/clear/:userId', clearCart);

module.exports = router;