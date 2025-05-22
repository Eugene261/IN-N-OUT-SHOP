const express = require('express');
const { 
    createOrder, 
    verifyAndUpdateOrder, 
    getAllOrders, 
    getOrdersByUser, 
    getOrderById, 
    fixShippingFees,
    createOrderAfterPayment 
} = require('../../controllers/shop/orderControllerWithCommission');

const router = express.Router();

// Legacy route - kept for backward compatibility
router.post('/create', createOrder);

// New route for creating orders after payment verification
router.post('/create-after-payment', createOrderAfterPayment);

// Other existing routes
router.post('/verify', verifyAndUpdateOrder);
router.get('/list/:userId', getOrdersByUser);
router.get('/details/:id', getOrderById);

// Route to fix shipping fees for existing orders
router.post('/fix-shipping/:orderId', fixShippingFees);

module.exports  = router;