const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../controllers/authController');
const { requireFeature, injectFeatureFlags } = require('../../utils/featureFlags');
const {
  getPendingProducts,
  getAllProductsWithStatus,
  approveProduct,
  rejectProduct,
  getApprovalStats
} = require('../../controllers/superAdmin/productApprovalController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Inject feature flags into all requests
router.use(injectFeatureFlags);

// Feature-gated routes - will return 503 if feature is disabled
router.use(requireFeature('PRODUCT_APPROVAL_ENABLED'));

/**
 * @route   GET /api/superAdmin/product-approval/pending
 * @desc    Get all pending products for approval
 * @access  SuperAdmin only
 * @params  ?page=1&limit=10
 */
router.get('/pending', getPendingProducts);

/**
 * @route   GET /api/superAdmin/product-approval/all
 * @desc    Get all products with their approval status
 * @access  SuperAdmin only
 * @params  ?page=1&limit=20&status=pending|approved|rejected
 */
router.get('/all', getAllProductsWithStatus);

/**
 * @route   POST /api/superAdmin/product-approval/:productId/approve
 * @desc    Approve a pending product
 * @access  SuperAdmin only
 * @body    { comments?: string }
 */
router.post('/:productId/approve', approveProduct);

/**
 * @route   POST /api/superAdmin/product-approval/:productId/reject
 * @desc    Reject a pending product
 * @access  SuperAdmin only
 * @body    { comments: string } (required)
 */
router.post('/:productId/reject', rejectProduct);

/**
 * @route   GET /api/superAdmin/product-approval/stats
 * @desc    Get approval statistics for dashboard
 * @access  SuperAdmin only
 * @params  ?timeframe=30 (days)
 */
router.get('/stats', getApprovalStats);

module.exports = router; 