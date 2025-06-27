const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const User = require('../../models/User');
const cloudinary = require('cloudinary').v2;
const { ImageUploadUtil } = require('../../helpers/cloudinary');
const asyncHandler = require('../../utils/asyncHandler');
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dq80s3m4e',
  api_key: process.env.CLOUDINARY_API_KEY || '993987412169513',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'o2DDXYmE8eUDN1L4qWFv1eSQE9s'
});

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
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm',
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
    
    if (conversations.length > 0) {
      console.log('🔍 First conversation sample:', JSON.stringify({
        id: conversations[0]._id,
        title: conversations[0].title,
        lastMessage: conversations[0].lastMessage,
        unreadCounts: conversations[0].unreadCounts,
        participants: conversations[0].participants?.map(p => ({
          userId: p.user?._id || p.user,
          userName: p.user?.userName,
          role: p.user?.role || p.role
        }))
      }, null, 2));
    }

    // Calculate total unread count
    const totalUnread = conversations.reduce((sum, conv) => {
      const userUnread = conv.unreadCounts.find(u => {
        // Handle both populated and non-populated user references
        const unreadUserId = u.user._id ? u.user._id.toString() : u.user.toString();
        return unreadUserId === userId.toString();
      });
      
      return sum + (userUnread ? userUnread.count : 0);
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

  // Update conversation lastMessage
  await conversation.updateLastMessage(message);

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

  console.log('🔍 sendMediaMessage called:', {
    conversationId,
    userId,
    filesCount: req.files?.length,
    fileTypes: req.files?.map(f => f.mimetype)
  });

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
    console.log('🔍 Processing file:', {
      name: file.originalname,
      type: file.mimetype,
      size: file.size
    });
    
    try {
      let uploadResult;
      let messageType;

      // Create data URI for upload
      const dataURI = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      // Determine message type and upload options based on file mime type
      if (file.mimetype.startsWith('image/')) {
        messageType = 'image';
        uploadResult = await ImageUploadUtil(dataURI);
      } else if (file.mimetype.startsWith('audio/')) {
        messageType = 'audio';
        
        // Verify cloudinary.uploader exists
        if (!cloudinary.uploader || typeof cloudinary.uploader.upload !== 'function') {
          throw new Error('Cloudinary uploader not properly initialized');
        }
        
        // For audio files, ensure mobile compatibility by converting to MP3 if needed
        const uploadOptions = {
          folder: 'messaging/audio',
          resource_type: 'video' // Cloudinary uses 'video' for audio files
        };
        
        // Convert WebM audio to MP3 for mobile compatibility
        if (file.mimetype === 'audio/webm' || file.originalname.includes('.webm')) {
          uploadOptions.format = 'mp3';
          uploadOptions.audio_codec = 'mp3';
          uploadOptions.transformation = [
            { audio_codec: 'mp3', audio_frequency: 44100 }
          ];
          console.log('🔄 Converting WebM audio to MP3 for mobile compatibility');
        }
        
        uploadResult = await cloudinary.uploader.upload(dataURI, uploadOptions);
      } else if (file.mimetype.startsWith('video/')) {
        messageType = 'video';
        uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'messaging/videos',
          resource_type: 'video'
        });
      } else {
        messageType = 'file';
        uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'messaging/files',
          resource_type: 'raw'
        });
      }

      console.log('✅ Upload successful:', uploadResult.public_id);

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
      console.error('❌ File upload error details:', {
        fileName: file.originalname,
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: `Failed to upload ${file.originalname}: ${error.message}`
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

  // Update conversation lastMessage  
  await conversation.updateLastMessage(message);

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

// Update user online status
const updateUserOnlineStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    console.log('📡 Heartbeat received from user:', userId);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      {
        isOnline: true,
        lastSeen: new Date(),
        lastHeartbeat: new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      console.log('❌ User not found for heartbeat:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Heartbeat updated for user:', userId);
    res.json({
      success: true,
      message: 'Online status updated'
    });
  } catch (error) {
    console.error('❌ Error updating online status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update online status'
    });
  }
});

// Get user online status
const getUserOnlineStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    console.log('📡 Status check requested for user:', userId);
    
    const user = await User.findById(userId).select('isOnline lastSeen lastHeartbeat userName');
    
    if (!user) {
      console.log('❌ User not found for status check:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Consider user offline if no heartbeat in last 3 minutes (more generous)
    const now = new Date();
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
    
    const isActuallyOnline = user.isOnline && 
      user.lastHeartbeat && 
      user.lastHeartbeat > threeMinutesAgo;

    console.log('📡 Status check result for user:', {
      userId,
      userName: user.userName,
      isOnline: user.isOnline,
      lastHeartbeat: user.lastHeartbeat,
      lastSeen: user.lastSeen,
      isActuallyOnline,
      threeMinutesAgo
    });

    // If user appears offline based on heartbeat, update their status
    if (user.isOnline && !isActuallyOnline) {
      console.log('📡 Marking user as offline due to stale heartbeat:', userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: user.lastHeartbeat || user.lastSeen || new Date()
      });
    }

    res.json({
      success: true,
      data: {
        userId,
        isOnline: isActuallyOnline,
        lastSeen: user.lastSeen,
        lastHeartbeat: user.lastHeartbeat
      }
    });
  } catch (error) {
    console.error('❌ Error getting online status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get online status'
    });
  }
});

// Mark user as offline
const markUserOffline = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    console.log('📡 Marking user offline:', userId);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      {
        isOnline: false,
        lastSeen: new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      console.log('❌ User not found for offline marking:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User marked offline:', userId);
    res.json({
      success: true,
      message: 'User marked offline'
    });
  } catch (error) {
    console.error('❌ Error marking user offline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark user offline'
    });
  }
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
  archiveConversation,
  updateUserOnlineStatus,
  getUserOnlineStatus,
  markUserOffline
}; 