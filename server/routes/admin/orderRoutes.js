const express = require('express');
const { getAllOrdersOfAllUsers, getOrdersDetailsForAdmin, updateOrderStatus } = require('../../controllers/admin/orderController_fixed');
const { isAuthenticated, isAdmin } = require('../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all admin order routes
router.use(isAuthenticated);
router.use(isAdmin);

router.get('/get', getAllOrdersOfAllUsers);
router.get('/details/:id', getOrdersDetailsForAdmin);
router.put('/update-status/:id', updateOrderStatus);


module.exports  = router;