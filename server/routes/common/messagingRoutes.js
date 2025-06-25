const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateDirectConversation,
  getConversationDetails,
  getMessages,
  sendTextMessage,
  markAsRead,
  getAvailableUsers
} = require('../../controllers/common/messagingController');
const authMiddleware = require('../../Middleware/auth');
const { check, validationResult } = require('express-validator');

// Middleware to check for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// All messaging routes require authentication
router.use(authMiddleware);

// Get all conversations for current user
router.get('/conversations', getConversations);

// Get or create direct conversation
router.post('/conversations/direct', [
  check('recipientId').isMongoId().withMessage('Valid recipient ID required'),
  check('title').optional().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters')
], handleValidationErrors, getOrCreateDirectConversation);

// Get conversation details
router.get('/conversations/:conversationId', [
  check('conversationId').isMongoId().withMessage('Valid conversation ID required')
], handleValidationErrors, getConversationDetails);

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', [
  check('conversationId').isMongoId().withMessage('Valid conversation ID required'),
  check('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  check('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
], handleValidationErrors, getMessages);

// Send text message
router.post('/conversations/:conversationId/messages/text', [
  check('conversationId').isMongoId().withMessage('Valid conversation ID required'),
  check('content').isLength({ min: 1, max: 5000 }).withMessage('Message content must be 1-5000 characters'),
  check('replyTo').optional().isMongoId().withMessage('Valid reply message ID required'),
  check('mentions').optional().isArray().withMessage('Mentions must be an array'),
  check('mentions.*').optional().isMongoId().withMessage('Valid user ID required for mentions'),
  check('priority').optional().isIn(['normal', 'high', 'urgent']).withMessage('Invalid priority level')
], handleValidationErrors, sendTextMessage);

// Mark messages as read
router.post('/conversations/:conversationId/read', [
  check('conversationId').isMongoId().withMessage('Valid conversation ID required'),
  check('messageIds').optional().isArray().withMessage('Message IDs must be an array'),
  check('messageIds.*').optional().isMongoId().withMessage('Valid message ID required')
], handleValidationErrors, markAsRead);

// Get available users for messaging
router.get('/users/available', getAvailableUsers);

module.exports = router; 