const express = require('express');
const router = express.Router();
const { featureFlags } = require('../../utils/featureFlags');
const { authMiddleware } = require('../../Middleware/auth');
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
  archiveConversation,
  addTestUnreadCounts
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

// Get available users for messaging
router.get('/users/available', getAvailableUsers);

// TEST ENDPOINT: Add test unread counts
router.post('/test/add-unread-counts', addTestUnreadCounts);

// Conversation routes
router.get('/conversations', getConversations);
router.post('/conversations/direct', getOrCreateDirectConversation);
router.get('/conversations/:conversationId', getConversationDetails);
router.post('/conversations/:conversationId/read', markAsRead);
router.post('/conversations/:conversationId/archive', archiveConversation);

// Message routes
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages/text', sendTextMessage);
router.post('/conversations/:conversationId/messages/media', uploadFiles, sendMediaMessage);
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);

module.exports = router; 