const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  // Basic message info
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Message content
  messageType: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'file'],
    required: true,
    default: 'text'
  },

  content: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    },
    maxlength: 5000
  },

  // File attachments
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    // For media files
    duration: Number, // for audio/video in seconds
    width: Number,    // for images/videos
    height: Number,   // for images/videos
    thumbnail: String // thumbnail URL for videos/images
  }],

  // Message status
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sending'
  },

  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Message metadata
  editedAt: Date,
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Reply functionality
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // System messages
  isSystemMessage: {
    type: Boolean,
    default: false
  },

  systemMessageType: {
    type: String,
    enum: ['user_joined', 'user_left', 'conversation_created', 'conversation_closed', 'conversation_reopened', 'role_change', 'team_update'],
    required: function() {
      return this.isSystemMessage;
    }
  },

  // Message priority (for urgent messages)
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Delivery tracking
  deliveredAt: Date,
  
  // Error information for failed messages
  errorInfo: {
    code: String,
    message: String,
    retryCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ status: 1 });
MessageSchema.index({ 'readBy.user': 1 });
MessageSchema.index({ replyTo: 1 });

// Virtual for checking if message is deleted
MessageSchema.virtual('isDeleted').get(function() {
  return !!this.deletedAt;
});

// Virtual for checking if message is edited
MessageSchema.virtual('isEdited').get(function() {
  return !!this.editedAt;
});

// Virtual for attachment count
MessageSchema.virtual('attachmentCount').get(function() {
  return this.attachments.length;
});

// Methods
MessageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

MessageSchema.methods.markAsDelivered = function() {
  if (!this.deliveredAt && this.status === 'sent') {
    this.deliveredAt = new Date();
    this.status = 'delivered';
  }
  return this.save();
};

MessageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.user.toString() === userId.toString());
};

MessageSchema.methods.softDelete = function(deletedBy) {
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

MessageSchema.methods.edit = function(newContent) {
  if (this.messageType === 'text') {
    this.content = newContent;
    this.editedAt = new Date();
    return this.save();
  }
  throw new Error('Only text messages can be edited');
};

MessageSchema.methods.addAttachment = function(attachmentData) {
  this.attachments.push(attachmentData);
  return this.save();
};

MessageSchema.methods.removeAttachment = function(attachmentId) {
  this.attachments = this.attachments.filter(a => a._id.toString() !== attachmentId.toString());
  return this.save();
};

// Static methods
MessageSchema.statics.findByConversation = function(conversationId, options = {}) {
  const query = {
    conversation: conversationId,
    deletedAt: { $exists: false }
  };
  
  const mongooseQuery = this.find(query)
    .populate('sender', 'userName email role profilePicture')
    .populate('replyTo', 'content messageType sender')
    .populate('mentions', 'userName email role')
    .sort({ createdAt: options.reverse ? -1 : 1 });
  
  if (options.limit) {
    mongooseQuery.limit(options.limit);
  }
  
  if (options.skip) {
    mongooseQuery.skip(options.skip);
  }
  
  if (options.before) {
    query.createdAt = { $lt: options.before };
  }
  
  if (options.after) {
    query.createdAt = { $gt: options.after };
  }
  
  return mongooseQuery;
};

MessageSchema.statics.createTextMessage = function(conversationId, senderId, content, options = {}) {
  const message = new this({
    conversation: conversationId,
    sender: senderId,
    messageType: 'text',
    content,
    replyTo: options.replyTo,
    mentions: options.mentions,
    priority: options.priority || 'normal'
  });
  
  return message.save();
};

MessageSchema.statics.createMediaMessage = function(conversationId, senderId, messageType, attachments, options = {}) {
  const message = new this({
    conversation: conversationId,
    sender: senderId,
    messageType,
    attachments,
    content: options.content, // Optional caption
    replyTo: options.replyTo,
    mentions: options.mentions,
    priority: options.priority || 'normal'
  });
  
  return message.save();
};

MessageSchema.statics.createSystemMessage = function(conversationId, systemMessageType, content = '', options = {}) {
  const message = new this({
    conversation: conversationId,
    sender: options.sender, // May be null for some system messages
    messageType: 'text',
    content,
    isSystemMessage: true,
    systemMessageType,
    status: 'sent'
  });
  
  return message.save();
};

MessageSchema.statics.getUnreadCount = function(conversationId, userId) {
  return this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId },
    deletedAt: { $exists: false }
  });
};

MessageSchema.statics.markConversationAsRead = async function(conversationId, userId) {
  const unreadMessages = await this.find({
    conversation: conversationId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId },
    deletedAt: { $exists: false }
  });
  
  const promises = unreadMessages.map(message => message.markAsRead(userId));
  return Promise.all(promises);
};

// Pre-save middleware
MessageSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Set status to sent for new messages
    this.status = 'sent';
    
    // Update conversation's last message
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(
      this.conversation,
      { $set: { updatedAt: new Date() } }
    );
  }
  next();
});

// Post-save middleware to update conversation
MessageSchema.post('save', async function(doc) {
  if (doc.isNew) {
    const Conversation = mongoose.model('Conversation');
    const conversation = await Conversation.findById(doc.conversation);
    
    if (conversation) {
      await conversation.updateLastMessage(doc);
    }
  }
});

module.exports = mongoose.model('Message', MessageSchema); 