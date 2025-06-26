import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  User,
  Clock,
  CheckCircle,
  MoreVertical,
  Paperclip,
  X,
  AlertCircle
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  fetchAvailableUsers,
  createConversation,
  markAsRead,
  setActiveConversation,
  setSearchTerm,
  setShowNewChatModal,
  clearError,
  selectConversations,
  selectActiveConversation,
  selectMessages,
  selectTotalUnread,
  selectAvailableUsers,
  selectLoading,
  selectMessagesLoading,
  selectSendingMessage,
  selectError,
  selectSearchTerm,
  selectShowNewChatModal,
  selectFilteredConversations
} from '../../../store/common/messaging-slice';

const MessagingDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // Redux selectors
  const conversations = useSelector(selectConversations);
  const activeConversation = useSelector(selectActiveConversation);
  const totalUnread = useSelector(selectTotalUnread);
  const availableUsers = useSelector(selectAvailableUsers);
  const loading = useSelector(selectLoading);
  const messagesLoading = useSelector(selectMessagesLoading);
  const sendingMessage = useSelector(selectSendingMessage);
  const error = useSelector(selectError);
  const searchTerm = useSelector(selectSearchTerm);
  const showNewChatModal = useSelector(selectShowNewChatModal);
  const filteredConversations = useSelector(selectFilteredConversations);
  
  // Get messages for active conversation
  const messages = useSelector(state => 
    activeConversation ? selectMessages(activeConversation._id)(state) : []
  );

  // Local UI state
  const [newMessage, setNewMessage] = useState('');
  const [showConversations, setShowConversations] = useState(true); // Mobile: toggle between conversations and chat
  const [hasInitialized, setHasInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    // Initialize data with error handling
    const initializeMessaging = async () => {
      try {
        setInitError(null);
        await Promise.all([
          dispatch(fetchConversations()).unwrap(),
          dispatch(fetchAvailableUsers()).unwrap()
        ]);
        setHasInitialized(true);
      } catch (err) {
        console.error('❌ Failed to initialize messaging:', err);
        setInitError('Failed to load messaging data');
        setHasInitialized(true); // Still mark as initialized to show error state
      }
    };

    if (!hasInitialized) {
      initializeMessaging();
    }
  }, [dispatch, hasInitialized]);

  useEffect(() => {
    if (activeConversation && hasInitialized) {
      const loadMessages = async () => {
        try {
          await dispatch(fetchMessages({ conversationId: activeConversation._id })).unwrap();
          dispatch(markAsRead({ conversationId: activeConversation._id }));
        } catch (err) {
          console.error('Failed to load messages:', err);
          toast.error('Failed to load messages');
        }
      };
      loadMessages();
    }
  }, [activeConversation, dispatch, hasInitialized]);

  useEffect(() => {
    // Show error notifications
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleStartNewConversation = async (recipientId, recipientName) => {
    try {
      await dispatch(createConversation({ 
        recipientId, 
        title: `Chat with ${recipientName}` 
      })).unwrap();
      
      setShowConversations(false); // Switch to chat view on mobile
      toast.success(`Started conversation with ${recipientName}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error(error?.message || 'Failed to start conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    try {
      await dispatch(sendMessage({
        conversationId: activeConversation._id,
        content: newMessage.trim()
      })).unwrap();
      
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error?.message || 'Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConversationSelect = (conversation) => {
    dispatch(setActiveConversation(conversation));
    setShowConversations(false); // Switch to chat view on mobile
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getOtherParticipant = (conversation) => {
    try {
      return conversation?.participants?.find(p => p?.user?._id !== user?.id)?.user;
    } catch (err) {
      return null;
    }
  };

  // Show initialization error
  if (initError) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Messaging Unavailable</h3>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button
            onClick={() => {
              setHasInitialized(false);
              setInitError(null);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading && conversations.length === 0 && !hasInitialized) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messaging...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations Sidebar */}
      <div className={`${
        showConversations ? 'flex' : 'hidden'
      } lg:flex lg:w-1/3 w-full bg-white border-r border-gray-200 flex-col relative`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">Messages</h1>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <button
              onClick={() => dispatch(setShowNewChatModal(true))}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              disabled={!availableUsers?.length}
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => dispatch(setSearchTerm(e.target.value))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {conversations?.length === 0 ? 'No conversations yet' : 'No conversations match your search'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations?.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                const unreadCount = conversation?.unreadCounts?.find(u => u.user === user?.id)?.count || 0;
                
                return (
                  <motion.div
                    key={conversation._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 lg:p-4 cursor-pointer hover:bg-gray-50 ${
                      activeConversation?._id === conversation._id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 relative">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" />
                        </div>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${
                            unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-900'
                          }`}>
                            {otherUser?.userName || 'Unknown User'}
                          </p>
                          <div className="flex items-center space-x-1 lg:space-x-2">
                            {conversation?.lastMessage?.sentAt && (
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.sentAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-xs lg:text-sm truncate mt-1 ${
                          unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                          {conversation?.lastMessage?.content || 'No messages yet'}
                        </p>
                        
                        <div className="flex items-center mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            otherUser?.role === 'superAdmin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {otherUser?.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${
        showConversations ? 'hidden' : 'flex'
      } lg:flex flex-1 flex-col`}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-3 lg:p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setShowConversations(true)}
                    className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-base lg:text-lg font-medium text-gray-900">
                      {getOtherParticipant(activeConversation)?.userName || 'Unknown User'}
                    </h2>
                    <p className="text-xs lg:text-sm text-gray-500">
                      {getOtherParticipant(activeConversation)?.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                    </p>
                  </div>
                </div>
                
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
              {messagesLoading && messages?.length === 0 ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : messages?.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages?.map((message) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message?.sender?._id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-3 lg:px-4 py-2 rounded-lg ${
                      message?.sender?._id === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm">{message?.content || ''}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        message?.sender?._id === user?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {message?.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : ''}
                        </span>
                        {message?.sender?._id === user?.id && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white p-3 lg:p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hidden lg:block">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    disabled={sendingMessage}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-sm lg:text-base text-gray-500">Choose a conversation from the sidebar or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-4 right-4 lg:left-4 lg:right-auto lg:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900">Start New Conversation</h2>
                <button
                  onClick={() => dispatch(setShowNewChatModal(false))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {availableUsers?.map((availableUser) => (
                  <div
                    key={availableUser._id}
                    onClick={() => handleStartNewConversation(availableUser._id, availableUser.userName)}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{availableUser.userName}</p>
                      <p className="text-xs text-gray-500">
                        {availableUser.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {(!availableUsers || availableUsers.length === 0) && (
                <p className="text-center text-gray-500 py-4 text-sm">
                  No users available for messaging
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagingDashboard; 