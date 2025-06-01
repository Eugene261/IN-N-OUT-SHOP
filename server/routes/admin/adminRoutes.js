const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../controllers/authController');
const { verifyToken, isAdmin } = require('../../Middleware/auth');

// Add a health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.id,
      role: req.user.role
    } : 'Not authenticated'
  });
});

module.exports = router; 