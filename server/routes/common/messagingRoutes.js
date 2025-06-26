const express = require('express');
const router = express.Router();
const { featureFlags } = require('../../utils/featureFlags');
const { authMiddleware } = require('../../Middleware/auth');
const cloudinary = require('cloudinary').v2;
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

// Configure Cloudinary (ensure it's configured)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dq80s3m4e',
  api_key: process.env.CLOUDINARY_API_KEY || '993987412169513',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'o2DDXYmE8eUDN1L4qWFv1eSQE9s'
});

// Test endpoint for Cloudinary configuration
router.get('/test-cloudinary', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Testing Cloudinary configuration...');
    
    // Test configuration
    const config = cloudinary.config();
    console.log('🔍 Cloudinary config:', {
      cloud_name: config.cloud_name,
      api_key: config.api_key ? '***set***' : 'missing',
      api_secret: config.api_secret ? '***set***' : 'missing'
    });

    // Test uploader availability
    if (!cloudinary.uploader || typeof cloudinary.uploader.upload !== 'function') {
      throw new Error('Cloudinary uploader not available');
    }

    res.json({
      success: true,
      message: 'Cloudinary is properly configured',
      config: {
        cloud_name: config.cloud_name,
        api_key_set: !!config.api_key,
        api_secret_set: !!config.api_secret,
        uploader_available: !!cloudinary.uploader
      }
    });
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary configuration error',
      error: error.message
    });
  }
});

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