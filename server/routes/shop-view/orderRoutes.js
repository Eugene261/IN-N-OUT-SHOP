const express = require('express');
const { createOrder, verifyAndUpdateOrder, getAllOrders, getOrdersByUser, getOrderById, fixShippingFees } = require('../../controllers/shop/orderControllerWithCommission');

const router = express.Router();

router.post('/create', createOrder);
router.post('/verify', verifyAndUpdateOrder);
router.get('/list/:userId', getOrdersByUser);
router.get('/details/:id', getOrderById);

// Route to fix shipping fees for existing orders
router.post('/fix-shipping/:orderId', fixShippingFees);

module.exports  = router;