const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  // Participants in the conversation
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'superAdmin'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Conversation metadata
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  type: {
    type: String,
    enum: ['direct', 'support', 'product_related', 'general', 'system'],
    default: 'direct'
  },

  // Related entities (if conversation is about a specific product, order, etc.)
  relatedEntity: {
    type: {
      type: String,
      enum: ['product', 'order', 'user', 'general']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },
    entityTitle: String
  },

  // Last message info for quick access
  lastMessage: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: Date,
    messageType: {
      type: String,
      enum: ['text', 'image', 'audio', 'video', 'file'],
      default: 'text'
    }
  },

  // Status and metadata
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  },

  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Unread counts for each participant
  unreadCounts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],

  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }],

  // Archive information
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Feature flags and permissions
  features: {
    fileSharing: {
      type: Boolean,
      default: true
    },
    audioMessages: {
      type: Boolean,
      default: true
    },
    videoMessages: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ConversationSchema.index({ 'participants.user': 1, status: 1 });
ConversationSchema.index({ 'lastMessage.sentAt': -1 });
ConversationSchema.index({ 'relatedEntity.entityId': 1, 'relatedEntity.type': 1 });
ConversationSchema.index({ createdAt: -1 });
ConversationSchema.index({ status: 1, priority: 1 });

// Virtual for total message count
ConversationSchema.virtual('messageCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation',
  count: true
});

// Virtual for participant count
ConversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Methods
ConversationSchema.methods.addParticipant = function(userId, role) {
  const existingParticipant = this.participants.find(p => {
    const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
    return participantUserId === userId.toString();
  });
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
    
    // Initialize unread count for new participant
    this.unreadCounts.push({
      user: userId,
      count: 0
    });
  }
  
  return this.save();
};

ConversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => {
    const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
    return participantUserId !== userId.toString();
  });
  this.unreadCounts = this.unreadCounts.filter(u => {
    const unreadUserId = u.user._id ? u.user._id.toString() : u.user.toString();
    return unreadUserId !== userId.toString();
  });
  return this.save();
};

ConversationSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = {
    messageId: message._id,
    content: message.messageType === 'text' ? message.content : `[${message.messageType.toUpperCase()}]`,
    sender: message.sender,
    sentAt: message.createdAt,
    messageType: message.messageType
  };
  
  // Update unread counts for all participants except sender
  this.unreadCounts.forEach(unread => {
    const unreadUserId = unread.user._id ? unread.user._id.toString() : unread.user.toString();
    const senderId = message.sender._id ? message.sender._id.toString() : message.sender.toString();
    if (unreadUserId !== senderId) {
      unread.count += 1;
    }
  });
  
  return this.save();
};

ConversationSchema.methods.markAsRead = function(userId) {
  const unreadEntry = this.unreadCounts.find(u => {
    const unreadUserId = u.user._id ? u.user._id.toString() : u.user.toString();
    return unreadUserId === userId.toString();
  });
  if (unreadEntry) {
    unreadEntry.count = 0;
  }
  return this.save();
};

ConversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => {
    // Handle both populated and non-populated user references
    const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
    return participantUserId === userId.toString();
  });
};

ConversationSchema.methods.getParticipantRole = function(userId) {
  const participant = this.participants.find(p => {
    const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
    return participantUserId === userId.toString();
  });
  return participant ? participant.role : null;
};

// Static methods
ConversationSchema.statics.findByParticipant = function(userId, options = {}) {
  const query = {
    'participants.user': userId,
    status: { $ne: 'archived' }
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .populate('participants.user', 'userName email role profilePicture')
    .populate('lastMessage.sender', 'userName email role profilePicture')
    .populate('unreadCounts.user', 'userName email role')
    .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 })
    .limit(options.limit || 50)
    .lean(); // Use lean() for better performance and cleaner data structure
};

ConversationSchema.statics.createDirectConversation = async function(participants, title, options = {}) {
  const conversation = new this({
    participants: participants.map(p => ({
      user: p.userId,
      role: p.role
    })),
    title,
    type: options.type || 'direct',
    relatedEntity: options.relatedEntity,
    priority: options.priority || 'normal',
    unreadCounts: participants.map(p => ({
      user: p.userId,
      count: 0
    }))
  });
  
  return conversation.save();
};

// Pre-save middleware
ConversationSchema.pre('save', function(next) {
  // Ensure unique participants
  const uniqueParticipants = [];
  const seenUsers = new Set();
  
  this.participants.forEach(participant => {
    const userId = participant.user._id ? participant.user._id.toString() : participant.user.toString();
    if (!seenUsers.has(userId)) {
      uniqueParticipants.push(participant);
      seenUsers.add(userId);
    }
  });
  
  this.participants = uniqueParticipants;
  next();
});

module.exports = mongoose.model('Conversation', ConversationSchema); 