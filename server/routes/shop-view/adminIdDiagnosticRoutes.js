const express = require('express');
const router = express.Router();
const { diagnoseCartAdminIds, diagnoseOrderShippingFees, fixAllOrders } = require('../../controllers/shop/adminIdDiagnostic');

// Diagnose adminId issues in a user's cart
router.get('/cart/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const results = await diagnoseCartAdminIds(userId);
        
        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error diagnosing cart adminIds:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while diagnosing cart adminIds',
            error: error.message
        });
    }
});

// Diagnose shipping fee issues in an order
router.get('/order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const results = await diagnoseOrderShippingFees(orderId);
        
        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error diagnosing order shipping fees:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while diagnosing order shipping fees',
            error: error.message
        });
    }
});

// Fix all orders with missing or incorrect adminIds and shipping fees
router.post('/fix-all-orders', async (req, res) => {
    try {
        const results = await fixAllOrders();
        
        res.status(200).json({
            success: true,
            message: `Fixed ${results.ordersFixed} out of ${results.ordersProcessed} orders`,
            data: results
        });
    } catch (error) {
        console.error('Error fixing all orders:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fixing all orders',
            error: error.message
        });
    }
});

module.exports = router;
