const express = require('express');
const { getAllOrdersOfAllUsers, getOrdersDetailsForAdmin, updateOrderStatus } = require('../../controllers/admin/orderController_fixed');
const { verifyToken, isAdmin } = require('../../Middleware/auth');

const router = express.Router();

// Apply authentication middleware to individual routes instead of router.use
router.get('/get', verifyToken, isAdmin, getAllOrdersOfAllUsers);
router.get('/details/:id', verifyToken, isAdmin, getOrdersDetailsForAdmin);
router.put('/update-status/:id', verifyToken, isAdmin, updateOrderStatus);


module.exports  = router;