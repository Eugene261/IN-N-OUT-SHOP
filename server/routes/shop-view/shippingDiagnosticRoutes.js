const express = require('express');
const router = express.Router();
const { diagnoseShippingFees, fixOrderShippingFees, traceShippingFeeFlow, checkOrderSchema } = require('../../services/shippingDiagnostic');

// Diagnose shipping fees for an order
router.get('/diagnose/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const results = await diagnoseShippingFees(orderId);
        
        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error diagnosing shipping fees:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while diagnosing shipping fees',
            error: error.message
        });
    }
});

// Fix shipping fees for an order
router.post('/fix/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const results = await fixOrderShippingFees(orderId);
        
        res.status(200).json({
            success: results.success,
            message: results.message,
            data: results
        });
    } catch (error) {
        console.error('Error fixing shipping fees:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fixing shipping fees',
            error: error.message
        });
    }
});

// Activate shipping fee flow tracing
router.post('/trace-shipping-flow', async (req, res) => {
    try {
        const result = await traceShippingFeeFlow();
        
        res.status(200).json({
            success: true,
            message: 'Shipping fee flow tracer activated',
            data: result
        });
    } catch (error) {
        console.error('Error activating shipping fee tracer:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while activating shipping fee tracer',
            error: error.message
        });
    }
});

// Check order schema for shipping fee fields
router.get('/check-order-schema', async (req, res) => {
    try {
        const result = await checkOrderSchema();
        
        res.status(200).json({
            success: true,
            message: 'Order schema checked',
            data: result
        });
    } catch (error) {
        console.error('Error checking order schema:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while checking order schema',
            error: error.message
        });
    }
});

module.exports = router;
