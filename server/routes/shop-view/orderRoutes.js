const express = require('express');
const { createOrder, verifyAndUpdateOrder, getAllOrders, getOrdersByUser, getOrderById } = require('../../controllers/shop/orderControllerWithCommission');

const router = express.Router();

router.post('/create', createOrder);
router.post('/verify', verifyAndUpdateOrder);
router.get('/list/:userId', getOrdersByUser);
router.get('/details/:id', getOrderById);





module.exports  = router;