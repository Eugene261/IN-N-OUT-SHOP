const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../controllers/authController.js');
const {
    getPaymentHistory,
    getPaymentDetails,
    getPaymentSummary
} = require('../../controllers/admin/vendorPaymentController.js');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get payment history for the logged-in admin
router.get('/history', getPaymentHistory);

// Get payment summary stats
router.get('/summary', getPaymentSummary);

// Get details of a specific payment
router.get('/:paymentId', getPaymentDetails);

module.exports = router; 