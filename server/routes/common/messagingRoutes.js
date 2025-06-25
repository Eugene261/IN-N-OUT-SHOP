const express = require('express');
const router = express.Router();
const { featureFlags } = require('../../utils/featureFlags');

// TEMPORARY: Disable all messaging routes to prevent app crash
// This prevents the "TypeError: argument handler is required" error
// Routes will be enabled once feature flags are properly configured

// Middleware to check if messaging is enabled
router.use((req, res, next) => {
  if (!featureFlags.isMessagingEnabled()) {
    return res.status(503).json({
      success: false,
      message: 'Messaging system is temporarily disabled',
      code: 'MESSAGING_DISABLED'
    });
  }
  next();
});

// All messaging endpoints return "disabled" response for now
router.all('/*', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Messaging system is temporarily disabled',
    code: 'MESSAGING_DISABLED'
  });
});

module.exports = router; 