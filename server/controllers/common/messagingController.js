const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const User = require('../../models/User');
const cloudinary = require('../../helpers/cloudinary');
const asyncHandler = require('../../utils/asyncHandler');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, audio, video, and documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

// Get all conversations for a user
const getConversations = asyncHandler(async (req, res) => {
  console.log('🔍 getConversations called');
  const { status, type } = req.query;
  const userId = req.user.id;
  
  console.log('🔍 Request details:', {
    userId,
    userRole: req.user.role,
    userName: req.user.userName,
    queryParams: { status, type, limit: req.query.limit }
  });

  try {
    console.log('🔍 Calling Conversation.findByParticipant...');
    const conversations = await Conversation.findByParticipant(userId, {
      status,
      type,
      limit: parseInt(req.query.limit) || 50
    });

    console.log('🔍 Conversations found:', conversations.length);
    console.log('🔍 Raw conversations:', JSON.stringify(conversations, null, 2));

    // Calculate total unread count
    const totalUnread = conversations.reduce((sum, conv) => {
      const userUnread = conv.unreadCounts.find(u => {
        // Handle both populated and non-populated user references
        const unreadUserId = u.user._id ? u.user._id.toString() : u.user.toString();
        return unreadUserId === userId.toString();
      });
      
      const unreadCount = userUnread ? userUnread.count : 0;
      console.log('🔍 Conversation unread calc:', {
        conversationId: conv._id,
        userId,
        unreadCounts: conv.unreadCounts,
        foundUserUnread: !!userUnread,
        unreadCount,
        runningSum: sum + unreadCount
      });
      
      return sum + unreadCount;
    }, 0);

    console.log('🔍 Total unread count:', totalUnread);

    const responseData = {
      conversations,
      totalUnread,
      count: conversations.length
    };

    console.log('🔍 Sending response:', JSON.stringify(responseData, null, 2));

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error in getConversations:', error);
    console.error('❌ Error stack:', error.stack);
    throw error; // Re-throw to let asyncHandler handle it
  }
});

// Get or create a direct conversation
const getOrCreateDirectConversation = asyncHandler(async (req, res) => {
  const { recipientId, title } = req.body;
  const currentUserId = req.user.id;

  // Validate recipient exists and has appropriate role
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return res.status(404).json({
      success: false,
      message: 'Recipient not found'
    });
  }

  // Check if conversation already exists between these users
  let conversation = await Conversation.findOne({
    type: 'direct',
    'participants.user': { $all: [currentUserId, recipientId] },
    status: { $ne: 'archived' }
  }).populate('participants.user', 'userName email role profilePicture');

  if (!conversation) {
    // Create new conversation
    const participants = [
      { userId: currentUserId, role: req.user.role },
      { userId: recipientId, role: recipient.role }
    ];

    conversation = await Conversation.createDirectConversation(
      participants,
      title || `Chat with ${recipient.userName}`
    );

    // Populate the new conversation
    conversation = await Conversation.findById(conversation._id)
      .populate('participants.user', 'userName email role profilePicture');

    // Create system message
    await Message.createSystemMessage(
      conversation._id,
      'conversation_created',
      `Conversation started by ${req.user.userName}`,
      { sender: currentUserId }
    );
  }

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// Get conversation details
const getConversationDetails = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  const conversation = await Conversation.findById(conversationId)
    .populate('participants.user', 'userName email role profilePicture')
    .populate('lastMessage.sender', 'userName email role');

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }

  // Check if user is participant
  if (!conversation.isParticipant(userId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this conversation'
    });
  }

  // Mark conversation as read
  await conversation.markAsRead(userId);

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// Get messages in a conversation
const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user.id;

  // Verify user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.isParticipant(userId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this conversation'
    });
  }

  const options = {
    limit: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit),
    reverse: true
  };

  const messages = await Message.findByConversation(conversationId, options);
  messages.reverse();

  const totalMessages = await Message.countDocuments({
    conversation: conversationId,
    deletedAt: { $exists: false }
  });

  res.status(200).json({
    success: true,
    data: {
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / parseInt(limit)),
        totalMessages,
        hasMore: (parseInt(page) * parseInt(limit)) < totalMessages
      }
    }
  });
});

// Send a text message
const sendTextMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, replyTo, mentions, priority } = req.body;
  const userId = req.user.id;

  console.log('🔍 Send message attempt:', {
    conversationId,
    userId,
    userRole: req.user.role,
    userName: req.user.userName
  });

  // Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId)
    .populate('participants.user', 'userName email role profilePicture');
  
  console.log('🔍 Conversation found:', !!conversation);
  if (conversation) {
    console.log('🔍 Conversation participants:', conversation.participants.map(p => ({
      userId: p.user._id.toString(),
      userName: p.user.userName,
      role: p.user.role
    })));
    console.log('🔍 Is participant check:', conversation.isParticipant(userId));
  }
  
  if (!conversation || !conversation.isParticipant(userId)) {
    console.log('❌ Access denied - conversation not found or user not participant');
    return res.status(403).json({
      success: false,
      message: 'Access denied to this conversation'
    });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message content is required'
    });
  }

  const message = await Message.createTextMessage(
    conversationId,
    userId,
    content.trim(),
    { replyTo, mentions, priority }
  );

  // Populate the message
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'userName email role profilePicture')
    .populate('replyTo', 'content messageType sender')
    .populate('mentions', 'userName email role');

  // Send email notifications to other participants
  try {
    const EmailService = require('../../services/emailService');
    const emailService = new EmailService();
    
    const sender = populatedMessage.sender;
    const otherParticipants = conversation.participants.filter(
      p => p.user._id.toString() !== userId
    );

    for (const participant of otherParticipants) {
      const recipient = participant.user;
      
      // Send email notification
      await emailService.sendMessageNotificationEmail(
        recipient.email,
        recipient.userName,
        sender.userName,
        sender.role,
        content.trim(),
        conversationId
      );
    }
  } catch (emailError) {
    console.error('Failed to send email notification for message:', emailError);
    // Don't fail the message sending if email fails
  }

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// Upload and send media message
const sendMediaMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, replyTo, mentions, priority } = req.body;
  const userId = req.user.id;

  // Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.isParticipant(userId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this conversation'
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const attachments = [];

  // Process each uploaded file
  for (const file of req.files) {
    try {
      let uploadResult;
      let messageType;

      // Determine message type based on file mime type
      if (file.mimetype.startsWith('image/')) {
        messageType = 'image';
        uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: 'messaging/images',
            resource_type: 'image'
          }
        );
      } else if (file.mimetype.startsWith('audio/')) {
        messageType = 'audio';
        uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: 'messaging/audio',
            resource_type: 'video' // Cloudinary uses 'video' for audio files
          }
        );
      } else if (file.mimetype.startsWith('video/')) {
        messageType = 'video';
        uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: 'messaging/videos',
            resource_type: 'video'
          }
        );
      } else {
        messageType = 'file';
        uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: 'messaging/files',
            resource_type: 'raw'
          }
        );
      }

      const attachment = {
        fileName: uploadResult.public_id,
        originalName: file.originalname,
        fileUrl: uploadResult.secure_url,
        fileSize: file.size,
        mimeType: file.mimetype
      };

      // Add media-specific properties
      if (uploadResult.width) attachment.width = uploadResult.width;
      if (uploadResult.height) attachment.height = uploadResult.height;
      if (uploadResult.duration) attachment.duration = uploadResult.duration;

      attachments.push(attachment);
    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to upload ${file.originalname}`
      });
    }
  }

  // Create message with attachments
  const messageType = attachments[0].mimeType.startsWith('image/') ? 'image' :
                     attachments[0].mimeType.startsWith('audio/') ? 'audio' :
                     attachments[0].mimeType.startsWith('video/') ? 'video' : 'file';

  const message = await Message.createMediaMessage(
    conversationId,
    userId,
    messageType,
    attachments,
    { content, replyTo, mentions, priority }
  );

  // Populate the message
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'userName email role profilePicture')
    .populate('replyTo', 'content messageType sender')
    .populate('mentions', 'userName email role');

  // Emit real-time event
  if (req.io) {
    conversation.participants.forEach(participant => {
      if (participant.user.toString() !== userId) {
        req.io.to(`user_${participant.user}`).emit('new_message', {
          conversationId,
          message: populatedMessage
        });
      }
    });
  }

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// Mark messages as read
const markAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { messageIds } = req.body;
  const userId = req.user.id;

  // Verify conversation access
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.isParticipant(userId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this conversation'
    });
  }

  if (messageIds && messageIds.length > 0) {
    // Mark specific messages as read
    await Promise.all(
      messageIds.map(messageId => 
        Message.findById(messageId).then(message => 
          message ? message.markAsRead(userId) : null
        )
      )
    );
  } else {
    // Mark entire conversation as read
    await Message.markConversationAsRead(conversationId, userId);
    await conversation.markAsRead(userId);
  }

  // Emit read receipt event
  if (req.io) {
    conversation.participants.forEach(participant => {
      if (participant.user.toString() !== userId) {
        req.io.to(`user_${participant.user}`).emit('messages_read', {
          conversationId,
          readBy: userId,
          messageIds: messageIds || 'all'
        });
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Messages marked as read'
  });
});

// Edit a message (text only)
const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const message = await Message.findById(messageId)
    .populate('sender', 'userName email role');

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user is the sender
  if (message.sender._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own messages'
    });
  }

  // Check if message can be edited (text only, not too old)
  const hoursSinceCreated = (new Date() - message.createdAt) / (1000 * 60 * 60);
  if (hoursSinceCreated > 24) {
    return res.status(400).json({
      success: false,
      message: 'Messages can only be edited within 24 hours'
    });
  }

  await message.edit(content);

  // Emit edit event
  if (req.io) {
    const conversation = await Conversation.findById(message.conversation);
    conversation.participants.forEach(participant => {
      req.io.to(`user_${participant.user}`).emit('message_edited', {
        conversationId: message.conversation,
        messageId: message._id,
        newContent: content,
        editedAt: message.editedAt
      });
    });
  }

  res.status(200).json({
    success: true,
    data: message
  });
});

// Delete a message
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user is the sender or has admin privileges
  const conversation = await Conversation.findById(message.conversation);
  const userRole = conversation.getParticipantRole(userId);
  
  if (message.sender.toString() !== userId && userRole !== 'superAdmin') {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own messages'
    });
  }

  await message.softDelete(userId);

  // Emit delete event
  if (req.io) {
    conversation.participants.forEach(participant => {
      req.io.to(`user_${participant.user}`).emit('message_deleted', {
        conversationId: message.conversation,
        messageId: message._id,
        deletedBy: userId
      });
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully'
  });
});

// Get available users for messaging
const getAvailableUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  let query = { _id: { $ne: currentUserId } };

  // Admins can message superAdmins and vice versa
  if (currentUserRole === 'admin') {
    query.role = 'superAdmin';
  } else if (currentUserRole === 'superAdmin') {
    query.role = { $in: ['admin', 'superAdmin'] };
  } else {
    return res.status(403).json({
      success: false,
      message: 'Messaging not available for your role'
    });
  }

  const users = await User.find(query)
    .select('userName email role profilePicture lastActive')
    .sort({ userName: 1 });

  res.status(200).json({
    success: true,
    data: users
  });
});

// Archive conversation
const archiveConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  const conversation = await Conversation.findById(conversationId);

  if (!conversation || !conversation.isParticipant(userId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this conversation'
    });
  }

  conversation.status = 'archived';
  conversation.archivedAt = new Date();
  conversation.archivedBy = userId;
  await conversation.save();

  res.status(200).json({
    success: true,
    message: 'Conversation archived successfully'
  });
});

module.exports = {
  // Multer middleware
  uploadFiles: upload.array('files', 10),
  
  // Controller methods
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
}; 