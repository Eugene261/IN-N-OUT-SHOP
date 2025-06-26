const express = require('express');
const router = express.Router();
const { featureFlags } = require('../../utils/featureFlags');
const authMiddleware = require('../../Middleware/auth');
const {
  uploadFiles,
  getConversations,
  getOrCreateDirectConversation,
  getConversationDetails,
  getMessages,
  sendTextMessage,
  sendMediaMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  getAvailableUsers,
  archiveConversation
} = require('../../controllers/common/messagingController');

// Middleware to check if messaging is enabled and handle errors gracefully
router.use((req, res, next) => {
  try {
    if (!featureFlags.isMessagingEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Messaging system is temporarily disabled',
        code: 'MESSAGING_DISABLED'
      });
    }
    next();
  } catch (error) {
    console.error('Messaging feature flag check failed:', error);
    return res.status(503).json({
      success: false,
      message: 'Messaging system is temporarily unavailable',
      code: 'MESSAGING_ERROR'
    });
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// EMERGENCY DISABLE: Messaging routes are causing server crashes
// Since messaging is disabled by default (MESSAGING_SYSTEM_ENABLED=false),
// we're temporarily disabling all routes to prevent server crashes
console.log('🚨 Messaging routes temporarily disabled to prevent server crashes');
console.log('   Messaging system is disabled by default via feature flags anyway');

// Return early with empty routes - messaging will return 503 via the middleware above
// This prevents any undefined handler errors while keeping the feature flag system intact

module.exports = router; 