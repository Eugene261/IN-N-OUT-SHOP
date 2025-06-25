const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware } = require('../../Middleware/auth.js');
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
router.post('/:id/like', optionalAuthMiddleware, toggleVideoLike);
router.post('/:id/comment', optionalAuthMiddleware, addVideoComment);

module.exports = router; 