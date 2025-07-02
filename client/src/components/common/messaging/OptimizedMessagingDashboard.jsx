import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  User,
  Clock,
  CheckCircle,
  Paperclip,
  X,
  AlertCircle,
  Mic,
  ArrowLeft
} from 'lucide-react';
import InlineAttachmentMenu from './InlineAttachmentMenu';
import InlineVoiceRecorder from './InlineVoiceRecorder';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import SoundNotifications from './SoundNotifications';
import NewConversationModal from './NewConversationModal';
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

const OptimizedMessagingDashboard = ({ isWidget = false }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // Redux selectors with memoization
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

  // Simplified local state
  const [newMessage, setNewMessage] = useState('');
  const [showConversations, setShowConversations] = useState(!isWidget);
  const [showInlineAttachment, setShowInlineAttachment] = useState(false);
  const [showInlineRecorder, setShowInlineRecorder] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for performance
  const messagesEndRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  
  // Memoized computations
  const hasConversations = useMemo(() => conversations?.length > 0, [conversations?.length]);
  const hasMessages = useMemo(() => messages?.length > 0, [messages?.length]);
  
  // Initialize messaging data once
  useEffect(() => {
    if (!user?.id || isInitialized) return;
    
    const initializeMessaging = async () => {
      try {
        // Clear any existing timeout
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }
        
        // Add timeout to prevent hanging
        initTimeoutRef.current = setTimeout(() => {
          console.warn('⏱️ Messaging initialization taking too long, continuing...');
          setIsInitialized(true);
        }, 10000);
        
        // Fetch initial data
        await Promise.allSettled([
          dispatch(fetchConversations({ limit: 20 })).unwrap(),
          dispatch(fetchAvailableUsers()).unwrap()
        ]);
        
        clearTimeout(initTimeoutRef.current);
        setIsInitialized(true);
      } catch (err) {
        console.error('❌ Failed to initialize messaging:', err);
        setIsInitialized(true); // Continue even if initialization fails
      }
    };
    
    initializeMessaging();
  }, [user?.id, dispatch, isInitialized]);
  
  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation || !isInitialized) return;
    
    const loadMessages = async () => {
      try {
        await dispatch(fetchMessages({ 
          conversationId: activeConversation._id,
          limit: 50 
        })).unwrap();
        
        // Mark as read
        dispatch(markAsRead({ conversationId: activeConversation._id }));
        
        // Scroll to bottom after messages load
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 300);
        
      } catch (err) {
        console.error('Failed to load messages:', err);
        // Don't show toast for auth errors
        if (!err?.message?.includes('Unauthorized')) {
          toast.error('Failed to load messages');
        }
      }
    };
    
    loadMessages();
  }, [activeConversation, dispatch, isInitialized]);
  
  // Handle errors with better UX
  useEffect(() => {
    if (!error) return;
    
    // Skip auth errors from background processes
    if (error.includes('Unauthorized') || error.includes('Authentication')) {
      console.log('🔔 Skipping auth error toast:', error);
    } else {
      toast.error(error);
    }
    
    dispatch(clearError());
  }, [error, dispatch]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (hasMessages && messagesEndRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            // User is at bottom, auto-scroll new messages
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        },
        { threshold: 0.1 }
      );
      
      observer.observe(messagesEndRef.current);
      return () => observer.disconnect();
    }
  }, [hasMessages]);
  
  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);
  
  // Memoized event handlers
  const handleConversationSelect = useCallback((conversation) => {
    dispatch(setActiveConversation(conversation));
    if (isWidget) {
      setShowConversations(false);
    }
  }, [dispatch, isWidget]);
  
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;
    
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear immediately for better UX
    
    try {
      await dispatch(sendMessage({
        conversationId: activeConversation._id,
        content: messageContent
      })).unwrap();
      
      // Play send sound
      if (window.playMessageSentSound) {
        window.playMessageSentSound();
      }
      
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setNewMessage(messageContent); // Restore message on failure
      
      if (err?.response?.status === 403) {
        toast.error('Access denied to this conversation');
      } else if (!err?.message?.includes('Unauthorized')) {
        toast.error('Failed to send message');
      }
    }
  }, [newMessage, activeConversation, sendingMessage, dispatch]);
  
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  const handleStartNewConversation = useCallback(async (recipientId, recipientName) => {
    try {
      await dispatch(createConversation({ 
        recipientId, 
        title: `Chat with ${recipientName}` 
      })).unwrap();
      
      if (isWidget) {
        setShowConversations(false);
      }
      toast.success(`Started conversation with ${recipientName}`);
      
    } catch (err) {
      console.error('Failed to start conversation:', err);
      toast.error('Failed to start conversation');
    }
  }, [dispatch, isWidget]);
  
  const handleFileUpload = useCallback((message) => {
    if (activeConversation) {
      dispatch(fetchMessages({ 
        conversationId: activeConversation._id,
        limit: 50 
      }));
    }
    setShowInlineAttachment(false);
    toast.success('Files sent successfully!');
    
    if (window.playMessageSentSound) {
      window.playMessageSentSound();
    }
  }, [activeConversation, dispatch]);
  
  const handleAudioSent = useCallback((message) => {
    if (activeConversation) {
      dispatch(fetchMessages({ 
        conversationId: activeConversation._id,
        limit: 50 
      }));
    }
    setShowInlineRecorder(false);
    toast.success('Voice message sent!');
    
    if (window.playMessageSentSound) {
      window.playMessageSentSound();
    }
  }, [activeConversation, dispatch]);
  
  // Get other participant helper
  const getOtherParticipant = useCallback((conversation) => {
    if (!conversation?.participants) return null;
    
    return conversation.participants.find(p => {
      const participantId = p.user?._id || p.user;
      return participantId !== user?.id;
    })?.user;
  }, [user?.id]);
  
  // Render conversation list
  const renderConversationList = () => (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <button
            onClick={() => dispatch(setShowNewChatModal(true))}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
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
      
      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading conversations...</div>
        ) : !hasConversations ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No conversations yet</p>
            <button
              onClick={() => dispatch(setShowNewChatModal(true))}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const userUnread = conversation.unreadCounts?.find(u => 
                (u.user?._id || u.user) === user?.id
              );
              const unreadCount = userUnread?.count || 0;
              
              return (
                <button
                  key={conversation._id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`w-full p-3 text-left hover:bg-gray-50 border-l-4 transition-colors ${
                    activeConversation?._id === conversation._id
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {otherParticipant?.avatar ? (
                          <img
                            src={otherParticipant.avatar}
                            alt={otherParticipant.userName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant?.userName || 'Unknown User'}
                        </h3>
                        {conversation.lastMessage?.sentAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(conversation.lastMessage.sentAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
  
  // Render message area
  const renderMessageArea = () => {
    if (!activeConversation) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Select a conversation to start messaging</p>
          </div>
        </div>
      );
    }
    
    const otherParticipant = getOtherParticipant(activeConversation);
    
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            {isWidget && (
              <button
                onClick={() => setShowConversations(true)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {otherParticipant?.avatar ? (
                  <img
                    src={otherParticipant.avatar}
                    alt={otherParticipant.userName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {otherParticipant?.userName || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500">
                {otherParticipant?.role === 'admin' ? 'Administrator' : 
                 otherParticipant?.role === 'superAdmin' ? 'Super Administrator' : 'User'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messagesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading messages...</p>
            </div>
          ) : !hasMessages ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwn = message.sender._id === user?.id || message.sender === user?.id;
                
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.messageType === 'text' ? (
                        <p className="text-sm">{message.content}</p>
                      ) : message.messageType === 'audio' ? (
                        <VoiceMessagePlayer message={message} />
                      ) : (
                        <div className="text-sm">
                          📎 {message.messageType.toUpperCase()} message
                        </div>
                      )}
                      
                      <div className={`text-xs mt-1 ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInlineAttachment(!showInlineAttachment)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowInlineRecorder(!showInlineRecorder)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="1"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Inline components */}
          {showInlineAttachment && (
            <div className="mt-2">
              <InlineAttachmentMenu
                conversationId={activeConversation._id}
                onFileUploaded={handleFileUpload}
                onClose={() => setShowInlineAttachment(false)}
              />
            </div>
          )}
          
          {showInlineRecorder && (
            <div className="mt-2">
              <InlineVoiceRecorder
                conversationId={activeConversation._id}
                onAudioSent={handleAudioSent}
                onClose={() => setShowInlineRecorder(false)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Show loading state
  if (!isInitialized) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messaging...</p>
        </div>
      </div>
    );
  }
  
  // Main render
  return (
    <div className={`h-full ${isWidget ? 'w-full' : 'max-w-6xl mx-auto'}`}>
      <SoundNotifications />
      
      {isWidget ? (
        // Widget mode: show either conversations or messages
        <div className="h-full">
          {showConversations ? renderConversationList() : renderMessageArea()}
        </div>
      ) : (
        // Full screen mode: show both side by side
        <div className="h-full flex bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="w-1/3 border-r border-gray-200">
            {renderConversationList()}
          </div>
          <div className="flex-1">
            {renderMessageArea()}
          </div>
        </div>
      )}
      
      {/* Modals */}
      {showNewChatModal && (
        <NewConversationModal
          isOpen={showNewChatModal}
          onClose={() => dispatch(setShowNewChatModal(false))}
          availableUsers={availableUsers}
          onStartConversation={handleStartNewConversation}
        />
      )}
    </div>
  );
};

export default OptimizedMessagingDashboard; 