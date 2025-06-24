const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../Middleware/auth.js');
const { 
  getFeaturedVideos,
  getPublishedVideos,
  getVideoById,
  toggleVideoLike,
  addVideoComment,
  getVideoComments,
  trackVideoView,
  getVideoProducts
} = require('../../controllers/shop/videoController.js');

// Public routes (no authentication required)
router.get('/featured', getFeaturedVideos);
router.get('/published', getPublishedVideos);
router.get('/:id', getVideoById);
router.get('/:id/products', getVideoProducts);
router.get('/:id/comments', getVideoComments);
router.put('/:id/view', trackVideoView);

// Routes that support both authenticated and guest users
router.post('/:id/like', (req, res, next) => {
  // Try to authenticate, but don't require it
  authMiddleware(req, res, (err) => {
    // Continue regardless of auth status
    next();
  });
}, toggleVideoLike);

router.post('/:id/comment', (req, res, next) => {
  // Try to authenticate, but don't require it
  authMiddleware(req, res, (err) => {
    // Continue regardless of auth status
    next();
  });
}, addVideoComment);

module.exports = router; 