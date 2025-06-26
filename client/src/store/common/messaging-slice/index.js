// CACHE BUST v4.0 - FINAL FIX: Complete elimination of action.error access to prevent ALL status errors
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Async thunks for API calls
export const fetchConversations = createAsyncThunk(
  'messaging/fetchConversations',
  async ({ status = '', type = '' } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/api/common/messaging/conversations`;
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (type) params.append('type', type);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Conversations fetch error:', error);
      // Safely handle all types of errors - network, HTTP, etc.
      const errorData = {
        message: (error?.response?.data?.message) || (error?.message) || 'Failed to fetch conversations',
        code: error?.response?.data?.code || null,
        status: error?.response?.status || null,
        response: error?.response || null,
        name: error?.name || 'UnknownError'
      };
      return rejectWithValue(errorData);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messaging/fetchMessages',
  async ({ conversationId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/common/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return { conversationId, ...response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch messages' });
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async ({ conversationId, content, replyTo, mentions, priority }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/common/messaging/conversations/${conversationId}/messages/text`,
        { content, replyTo, mentions, priority },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return { conversationId, message: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to send message' });
    }
  }
);

export const sendMediaMessage = createAsyncThunk(
  'messaging/sendMediaMessage',
  async ({ conversationId, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/common/messaging/conversations/${conversationId}/messages/media`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return { conversationId, message: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to send media message' });
    }
  }
);

export const createConversation = createAsyncThunk(
  'messaging/createConversation',
  async ({ recipientId, title }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/common/messaging/conversations/direct`,
        { recipientId, title },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create conversation' });
    }
  }
);

export const markAsRead = createAsyncThunk(
  'messaging/markAsRead',
  async ({ conversationId, messageIds = [] }, { rejectWithValue }) => {
    try {
      await axios.post(
        `${API_URL}/api/common/messaging/conversations/${conversationId}/read`,
        { messageIds: messageIds.length > 0 ? messageIds : undefined },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return { conversationId, messageIds };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to mark as read' });
    }
  }
);

export const fetchAvailableUsers = createAsyncThunk(
  'messaging/fetchAvailableUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/common/messaging/users/available`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Available users fetch error:', error);
      // Safely handle all types of errors - network, HTTP, etc.
      const errorData = {
        message: (error?.response?.data?.message) || (error?.message) || 'Failed to fetch available users',
        code: error?.response?.data?.code || null,
        status: error?.response?.status || null,
        response: error?.response || null,
        name: error?.name || 'UnknownError'
      };
      return rejectWithValue(errorData);
    }
  }
);

export const getConversationDetails = createAsyncThunk(
  'messaging/getConversationDetails',
  async ({ conversationId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/common/messaging/conversations/${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to get conversation details' });
    }
  }
);

// Initial state
const initialState = {
  // Conversations
  conversations: [],
  activeConversation: null,
  totalUnread: 0,
  
  // Messages
  messages: {},
  messagePagination: {},
  
  // Available users for new conversations
  availableUsers: [],
  
  // UI state
  loading: false,
  messagesLoading: false,
  sendingMessage: false,
  error: null,
  
  // Search and filters
  searchTerm: '',
  
  // Modals and UI
  showNewChatModal: false,
  
  // Real-time updates
  typingUsers: {},
  onlineUsers: [],
  
  // Message composition
  newMessage: '',
  replyToMessage: null
};

// Messaging slice
const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    // UI actions
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    
    setNewMessage: (state, action) => {
      state.newMessage = action.payload;
    },
    
    setShowNewChatModal: (state, action) => {
      state.showNewChatModal = action.payload;
    },
    
    setReplyToMessage: (state, action) => {
      state.replyToMessage = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Real-time updates
    addRealTimeMessage: (state, action) => {
      const payload = action.payload || {};
      const { conversationId, message } = payload;
      
      if (!conversationId || !message) return;
      
      if (state.messages[conversationId]) {
        state.messages[conversationId].push(message);
      }
      
      // Update conversation last message
      const convIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (convIndex !== -1) {
        state.conversations[convIndex].lastMessage = {
          content: message.content,
          sentAt: message.createdAt,
          sender: message.sender,
          messageType: message.messageType
        };
        
        // Move to top of list
        const conversation = state.conversations.splice(convIndex, 1)[0];
        state.conversations.unshift(conversation);
        
        // Update unread count if not active conversation
        if (state.activeConversation?._id !== conversationId) {
          const userUnread = conversation.unreadCounts?.find(u => u.user === message.sender._id);
          if (userUnread) {
            userUnread.count += 1;
          }
          state.totalUnread += 1;
        }
      }
    },
    
    updateMessageStatus: (state, action) => {
      // Safe destructuring with fallbacks
      const payload = action.payload || {};
      const { conversationId, messageId, status } = payload;
      
      if (conversationId && messageId && status && state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex].status = status;
        }
      }
    },
    
    setTypingUser: (state, action) => {
      const payload = action.payload || {};
      const { conversationId, userId, isTyping } = payload;
      
      if (!conversationId || !userId) return;
      
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      
      if (isTyping) {
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId);
        }
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(id => id !== userId);
      }
    },
    
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    
    // Reset states
    resetMessages: (state) => {
      state.messages = {};
      state.messagePagination = {};
    },
    
    resetState: () => initialState
  },
  
  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload?.conversations || [];
        state.totalUnread = action.payload?.totalUnread || 0;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        // SAFER ERROR ACCESS: Completely avoid action.error to prevent status access errors
        const payload = action.payload;
        if (payload && typeof payload === 'object' && payload.message) {
          state.error = payload.message;
        } else {
          state.error = 'Failed to fetch conversations';
        }
      });
    
    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { conversationId, messages, pagination } = action.payload || {};
        
        if (conversationId && messages) {
          if (pagination?.currentPage === 1) {
            // New conversation or refresh
            state.messages[conversationId] = messages;
          } else {
            // Loading more messages (prepend older messages)
            state.messages[conversationId] = [
              ...messages,
              ...(state.messages[conversationId] || [])
            ];
          }
          
          if (pagination) {
            state.messagePagination[conversationId] = pagination;
          }
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        // SAFER ERROR ACCESS: Completely avoid action.error to prevent status access errors
        const payload = action.payload;
        if (payload && typeof payload === 'object' && payload.message) {
          state.error = payload.message;
        } else {
          state.error = 'Failed to fetch messages';
        }
      });
    
    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { conversationId, message } = action.payload || {};
        
        // Add message to conversation
        if (conversationId && message && state.messages[conversationId]) {
          state.messages[conversationId].push(message);
        }
        
        // Update conversation last message
        if (conversationId && message) {
          const convIndex = state.conversations.findIndex(c => c._id === conversationId);
          if (convIndex !== -1) {
            state.conversations[convIndex].lastMessage = {
              content: message.content,
              sentAt: message.createdAt,
              sender: message.sender,
              messageType: message.messageType
            };
            
            // Move to top
            const conversation = state.conversations.splice(convIndex, 1)[0];
            state.conversations.unshift(conversation);
          }
        }
        
        // Clear new message
        state.newMessage = '';
        state.replyToMessage = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        // SAFER ERROR ACCESS: Completely avoid action.error to prevent status access errors
        const payload = action.payload;
        if (payload && typeof payload === 'object' && payload.message) {
          state.error = payload.message;
        } else {
          state.error = 'Failed to send message';
        }
      });

    // Send media message
    builder
      .addCase(sendMediaMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMediaMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { conversationId, message } = action.payload || {};
        
        // Add message to conversation
        if (conversationId && message && state.messages[conversationId]) {
          state.messages[conversationId].push(message);
        }
        
        // Update conversation last message
        if (conversationId && message) {
          const convIndex = state.conversations.findIndex(c => c._id === conversationId);
          if (convIndex !== -1) {
            state.conversations[convIndex].lastMessage = {
              content: message.content || '📎 Media message',
              sentAt: message.createdAt,
              sender: message.sender,
              messageType: message.messageType
            };
            
            // Move to top
            const conversation = state.conversations.splice(convIndex, 1)[0];
            state.conversations.unshift(conversation);
          }
        }
      })
      .addCase(sendMediaMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        const payload = action.payload;
        if (payload && typeof payload === 'object' && payload.message) {
          state.error = payload.message;
        } else {
          state.error = 'Failed to send media message';
        }
      });
    
    // Create conversation
    builder
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading = false;
        const newConversation = action.payload;
        
        if (newConversation) {
          // Add to top of conversations list
          state.conversations.unshift(newConversation);
          
          // Set as active
          state.activeConversation = newConversation;
          
          // Close modal
          state.showNewChatModal = false;
        }
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        // SAFER ERROR ACCESS: Completely avoid action.error to prevent status access errors
        const payload = action.payload;
        if (payload && typeof payload === 'object' && payload.message) {
          state.error = payload.message;
        } else {
          state.error = 'Failed to create conversation';
        }
      });
    
    // Mark as read
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload || {};
        
        if (conversationId) {
          // Update conversation unread count
          const convIndex = state.conversations.findIndex(c => c._id === conversationId);
          if (convIndex !== -1) {
            const conversation = state.conversations[convIndex];
            const userUnread = conversation.unreadCounts?.find(u => u.user !== conversation.lastMessage?.sender?._id);
            if (userUnread && userUnread.count > 0) {
              state.totalUnread -= userUnread.count;
              userUnread.count = 0;
            }
          }
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        // SAFER ERROR ACCESS: Completely avoid action.error to prevent status access errors
        const payload = action.payload;
        let errorMessage = 'Failed to mark as read';
        if (payload && typeof payload === 'object' && payload.message) {
          errorMessage = payload.message;
        }
        console.warn('Failed to mark as read:', errorMessage);
      });
    
    // Fetch available users
    builder
      .addCase(fetchAvailableUsers.fulfilled, (state, action) => {
        state.availableUsers = action.payload || [];
      })
      .addCase(fetchAvailableUsers.rejected, (state, action) => {
        // SAFER ERROR ACCESS: Completely avoid action.error to prevent status access errors
        const payload = action.payload;
        let errorMessage = 'Failed to fetch available users';
        if (payload && typeof payload === 'object' && payload.message) {
          errorMessage = payload.message;
        }
        console.warn('Failed to fetch available users:', errorMessage);
        state.availableUsers = [];
      });
    
    // Get conversation details
    builder
      .addCase(getConversationDetails.fulfilled, (state, action) => {
        if (action.payload) {
          state.activeConversation = action.payload;
        }
      })
      .addCase(getConversationDetails.rejected, (state, action) => {
        // SAFER ERROR ACCESS: Completely avoid action.error to prevent status access errors
        const payload = action.payload;
        let errorMessage = 'Failed to get conversation details';
        if (payload && typeof payload === 'object' && payload.message) {
          errorMessage = payload.message;
        }
        console.warn('Failed to get conversation details:', errorMessage);
      });
  }
});

// Export actions
export const {
  setActiveConversation,
  setSearchTerm,
  setNewMessage,
  setShowNewChatModal,
  setReplyToMessage,
  clearError,
  addRealTimeMessage,
  updateMessageStatus,
  setTypingUser,
  setOnlineUsers,
  resetMessages,
  resetState
} = messagingSlice.actions;

// Selectors
export const selectConversations = (state) => state.messaging.conversations;
export const selectActiveConversation = (state) => state.messaging.activeConversation;
export const selectMessages = (conversationId) => (state) => state.messaging.messages[conversationId] || [];
export const selectTotalUnread = (state) => state.messaging.totalUnread;
export const selectAvailableUsers = (state) => state.messaging.availableUsers;
export const selectLoading = (state) => state.messaging.loading;
export const selectMessagesLoading = (state) => state.messaging.messagesLoading;
export const selectSendingMessage = (state) => state.messaging.sendingMessage;
export const selectError = (state) => state.messaging.error;
export const selectSearchTerm = (state) => state.messaging.searchTerm;
export const selectNewMessage = (state) => state.messaging.newMessage;
export const selectShowNewChatModal = (state) => state.messaging.showNewChatModal;
export const selectReplyToMessage = (state) => state.messaging.replyToMessage;
export const selectTypingUsers = (conversationId) => (state) => state.messaging.typingUsers[conversationId] || [];
export const selectOnlineUsers = (state) => state.messaging.onlineUsers;

// Filtered conversations selector
export const selectFilteredConversations = (state) => {
  const { conversations, searchTerm } = state.messaging;
  
  if (!searchTerm) return conversations;
  
  return conversations.filter(conversation => {
    const otherParticipant = conversation.participants.find(p => p.user._id !== state.auth.user?.id);
    return otherParticipant?.user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conversation.title.toLowerCase().includes(searchTerm.toLowerCase());
  });
};

export default messagingSlice.reducer; 