const express = require('express');
const { initializePayment, verifyPayment, getPaymentChannels } = require('../../controllers/payment/paystackController');
const { authMiddleware } = require('../../controllers/authController');

const router = express.Router();

// Initialize payment
router.post('/initialize', authMiddleware, initializePayment);

// Verify payment
router.get('/verify/:reference', authMiddleware, verifyPayment);

// Get payment channels
router.get('/channels', getPaymentChannels);

module.exports = router;
