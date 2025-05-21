const express = require('express');
const router = express.Router();
const { authMiddleware, isSuperAdmin } = require('../../controllers/authController.js');
const {
    getAllVendorPayments,
    getVendorPaymentDetails,
    createVendorPayment,
    updatePaymentStatus,
    getVendorPaymentSummary
} = require('../../controllers/superAdmin/vendorPaymentController.js');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(isSuperAdmin);

// Get all vendor payments (for super admin)
router.get('/', getAllVendorPayments);

// Get payment summary stats
router.get('/summary', getVendorPaymentSummary);

// Create a new vendor payment
router.post('/', createVendorPayment);

// Update payment status
router.patch('/:paymentId/status', updatePaymentStatus);

// Get details of a specific payment
router.get('/:paymentId', getVendorPaymentDetails);

module.exports = router;
