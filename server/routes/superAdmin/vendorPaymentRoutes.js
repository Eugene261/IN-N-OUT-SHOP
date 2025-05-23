const express = require('express');
const router = express.Router();
const { authMiddleware, isSuperAdmin } = require('../../controllers/authController.js');
const {
    getAllVendorPayments,
    getVendorPaymentDetails,
    createVendorPayment,
    uploadReceipt,
    updatePaymentStatus,
    getVendorPaymentSummary,
    getAdminsAndVendors,
    upload
} = require('../../controllers/superAdmin/vendorPaymentController.js');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(isSuperAdmin);

// Get all vendor payments (for super admin)
router.get('/', getAllVendorPayments);

// Get payment summary stats
router.get('/summary', getVendorPaymentSummary);

// Get admins and vendors list for dropdown
router.get('/admins-vendors', getAdminsAndVendors);

// Create a new vendor payment with optional receipt upload
router.post('/', upload.single('receipt'), createVendorPayment);

// Upload receipt for existing payment
router.post('/:paymentId/receipt', upload.single('receipt'), uploadReceipt);

// Update payment status
router.patch('/:paymentId/status', updatePaymentStatus);

// Get details of a specific payment
router.get('/:paymentId', getVendorPaymentDetails);

module.exports = router;
