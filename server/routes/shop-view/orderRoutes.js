const express = require('express');
const { createOrder, verifyAndUpdateOrder, getAllOrdersByUser, getOrdersDetails } = require('../../controllers/shop/orderController');

const router = express.Router();

router.post('/create', createOrder);
router.post('/verify', verifyAndUpdateOrder);
router.get('/list/:userId', getAllOrdersByUser);
router.get('/details/:id', getOrdersDetails);





module.exports  = router;