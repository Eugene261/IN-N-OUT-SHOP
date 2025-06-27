// CACHE BUST v3.0 - Critical error handling fixes for status access errors
import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  Mic,
  ArrowLeft
} from 'lucide-react';
import InlineAttachmentMenu from './InlineAttachmentMenu';
import InlineVoiceRecorder from './InlineVoiceRecorder';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import SoundNotifications from './SoundNotifications';
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
import axios from 'axios';

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
  const [showInlineAttachment, setShowInlineAttachment] = useState(false);
  const [showInlineRecorder, setShowInlineRecorder] = useState(false);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [participantStatuses, setParticipantStatuses] = useState({}); // Track real online status
  const heartbeatIntervalRef = useRef(null);
  const statusCheckIntervalRef = useRef(null);

  useEffect(() => {
    // Initialize data with error handling
    const initializeMessaging = async () => {
      try {
        setInitError(null);
        console.log('🔄 Initializing messaging system...');
        
        // SAFER ERROR HANDLING: Wrap individual dispatches to handle errors properly
        const conversationsPromise = dispatch(fetchConversations({})).unwrap().catch(err => {
          console.error('❌ Failed to fetch conversations:', err);
          console.log('🔍 Error type:', typeof err);
          console.log('🔍 Error details:', JSON.stringify(err, null, 2));
          
          // Ultra-safe check if messaging is disabled (503 error with specific code)  
          if (err && typeof err === 'object' && 
              err.hasOwnProperty('status') && typeof err.status === 'number' && err.status === 503 && 
              err.hasOwnProperty('code') && typeof err.code === 'string' && err.code === 'MESSAGING_DISABLED') {
            console.log('🚫 Messaging system is disabled');
            throw new Error('MESSAGING_DISABLED');
          }
          
          console.log('⚠️ Conversations fetch failed, returning empty result');
          // Return empty result for other errors
          return { conversations: [], totalUnread: 0 };
        });
        
        const usersPromise = dispatch(fetchAvailableUsers()).unwrap().catch(err => {
          console.error('❌ Failed to fetch available users:', err);
          console.log('🔍 Users error type:', typeof err);
          console.log('🔍 Users error details:', JSON.stringify(err, null, 2));
          
          // Ultra-safe check if messaging is disabled (503 error with specific code)
          if (err && typeof err === 'object' && 
              err.hasOwnProperty('status') && typeof err.status === 'number' && err.status === 503 && 
              err.hasOwnProperty('code') && typeof err.code === 'string' && err.code === 'MESSAGING_DISABLED') {
            console.log('🚫 Messaging system is disabled');
            throw new Error('MESSAGING_DISABLED');
          }
          
          console.log('⚠️ Users fetch failed, returning empty array');
          // Return empty array for other errors
          return [];
        });
        
        const [conversationsResult, usersResult] = await Promise.all([conversationsPromise, usersPromise]);
        console.log('✅ Messaging initialization complete');
        console.log('🔍 Conversations result:', conversationsResult);
        console.log('🔍 Users result:', usersResult);
        console.log('🔍 Conversations type:', typeof conversationsResult);
        console.log('🔍 Users type:', typeof usersResult);
        setHasInitialized(true);
      } catch (err) {
        console.error('❌ Failed to initialize messaging:', err);
        // SAFER ERROR MESSAGE EXTRACTION
        let errorMessage = 'Failed to load messaging data';
        if (err && typeof err === 'object') {
          if (err.message) {
            errorMessage = err.message;
          } else if (err.response && err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (typeof err === 'string') {
            errorMessage = err;
          }
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        console.log('🔍 Setting init error:', errorMessage);
        setInitError(errorMessage);
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
          // SAFER ERROR MESSAGE EXTRACTION
          let errorMessage = 'Failed to load messages';
          if (err && typeof err === 'object' && err.message) {
            errorMessage = err.message;
          }
          toast.error(errorMessage);
        }
      };
      loadMessages();
    }
  }, [activeConversation, dispatch, hasInitialized]);

  // Auto-refresh messages and conversations with smart error handling
  useEffect(() => {
    if (!hasInitialized) return;

    let consecutiveErrors = 0;
    let isComponentMounted = true;
    let timeoutId = null;

    const refreshData = async () => {
      if (!isComponentMounted) return;

      try {
        // Refresh conversations to get latest messages and unread counts
        await dispatch(fetchConversations()).unwrap();
        
        // Refresh current conversation messages if active
        if (activeConversation) {
          await dispatch(fetchMessages({ conversationId: activeConversation._id })).unwrap();
        }
        
        // Reset error count on success
        consecutiveErrors = 0;
        scheduleNextRefresh(5000); // Normal 5 second interval
      } catch (error) {
        if (!isComponentMounted) return;
        
        consecutiveErrors++;
        
        // Check if it's a network error
        const isNetworkError = !navigator.onLine || 
                              error?.message?.includes('Network Error') ||
                              error?.code === 'ERR_NETWORK' ||
                              error?.code === 'ERR_INTERNET_DISCONNECTED' ||
                              error?.response?.status === 0 ||
                              error?.message?.includes('ERR_ADDRESS_UNREACHABLE');
        
        if (isNetworkError) {
          console.warn('🌐 Network connection issue during auto-refresh');
        } else {
          console.error('❌ Auto-refresh failed:', error);
        }
        
        // Exponential backoff: 5s, 10s, 20s, 30s max
        const backoffDelay = Math.min(5000 * Math.pow(2, consecutiveErrors - 1), 30000);
        scheduleNextRefresh(backoffDelay);
      }
    };

    const scheduleNextRefresh = (delay) => {
      if (!isComponentMounted) return;
      
      timeoutId = setTimeout(() => {
        if (isComponentMounted) {
          refreshData();
        }
      }, delay);
    };

    // Initial refresh
    refreshData();

    return () => {
      isComponentMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [dispatch, hasInitialized, activeConversation]);

  useEffect(() => {
    // Show error notifications
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Monitor online/offline status for better user experience  
  useEffect(() => {
    const handleOnline = () => {
      console.log('📶 Network restored');
    };
    const handleOffline = () => {
      console.log('📴 Network lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Heartbeat system - ping server every 30 seconds to maintain online status
    const startHeartbeat = () => {
      heartbeatIntervalRef.current = setInterval(async () => {
        if (navigator.onLine && user?.id) {
          try {
            const token = localStorage.getItem('token');
            await axios.post(
              `${import.meta.env.VITE_API_URL}/api/common/messaging/heartbeat`,
              {},
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
          } catch (error) {
            // Silent heartbeat errors - don't spam console
            if (error.response?.status !== 401) {
              console.log('⚠️ Heartbeat failed:', error.message);
            }
          }
        }
      }, 30000); // Every 30 seconds
    };

    // Check online status of conversation participants every minute
    const startStatusCheck = () => {
      statusCheckIntervalRef.current = setInterval(async () => {
        if (navigator.onLine && conversations.length > 0) {
          await checkParticipantStatuses();
        }
      }, 60000); // Every minute
    };

    startHeartbeat();
    startStatusCheck();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, [user?.id, conversations]);

  // Check online status of conversation participants
  const checkParticipantStatuses = async () => {
    if (!conversations.length) return;

    try {
      const token = localStorage.getItem('token');
      const allParticipants = new Set();
      
      // Collect all unique participant IDs
      conversations.forEach(conv => {
        conv.participants?.forEach(p => {
          const participantId = p.user?._id || p.user;
          if (participantId && participantId !== user?.id) {
            allParticipants.add(participantId);
          }
        });
      });

      // Check status for each participant
      const statusPromises = Array.from(allParticipants).map(async (participantId) => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/common/messaging/users/${participantId}/status`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          return { participantId, status: response.data.data };
        } catch (error) {
          return { participantId, status: { isOnline: false, lastSeen: new Date() } };
        }
      });

      const statuses = await Promise.all(statusPromises);
      const newStatuses = {};
      statuses.forEach(({ participantId, status }) => {
        newStatuses[participantId] = status;
      });

      setParticipantStatuses(newStatuses);
    } catch (error) {
      console.error('Error checking participant statuses:', error);
    }
  };

  // Monitor messages for incoming message sounds
  useEffect(() => {
    if (!activeConversation || !messages || !hasInitialized) {
      setPrevMessagesLength(messages?.length || 0);
      return;
    }

    const currentMessageCount = messages.length;
    
    // If messages increased and we have previous messages (not initial load)
    if (currentMessageCount > prevMessagesLength && prevMessagesLength > 0) {
      // Get the new messages
      const newMessages = messages.slice(prevMessagesLength);
      
      // Check if any new message is from another user (not current user)
      const hasIncomingMessage = newMessages.some(msg => 
        msg.sender?._id !== user?.id && msg.sender?.toString() !== user?.id
      );
      
      if (hasIncomingMessage && window.playMessageReceivedSound) {
        window.playMessageReceivedSound();
        console.log('📱 MessagingDashboard: Playing receive sound for incoming message');
      }
    }
    
    setPrevMessagesLength(currentMessageCount);
  }, [messages, activeConversation, user?.id, hasInitialized, prevMessagesLength]);

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
      // SAFER ERROR MESSAGE EXTRACTION
      let errorMessage = 'Failed to start conversation';
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      toast.error(errorMessage);
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
      
      // Trigger notification update events for real-time updates
      window.dispatchEvent(new CustomEvent('new_message', { 
        detail: { conversationId: activeConversation._id } 
      }));
      
      // Cross-tab notification using localStorage
      localStorage.setItem('new_message_notification', Date.now().toString());
      setTimeout(() => localStorage.removeItem('new_message_notification'), 1000);
      
      // Play send sound
      if (window.playMessageSentSound) {
        window.playMessageSentSound();
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      console.log('🔍 Send message error details:', JSON.stringify(error, null, 2));
      console.log('🔍 Active conversation:', activeConversation);
      console.log('🔍 User:', user);
      
      // SAFER ERROR MESSAGE EXTRACTION
      let errorMessage = 'Failed to send message';
      
      // Check for specific 403 error
      if (error?.response?.status === 403) {
        errorMessage = 'Access denied to this conversation. You may not be a participant in this conversation.';
        console.log('🔍 403 Error - Conversation ID:', activeConversation?._id);
        console.log('🔍 403 Error - User ID:', user?.id);
      } else if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast.error(errorMessage);
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

  const handleFileUpload = (message) => {
    // File was uploaded successfully, refresh messages
    if (activeConversation) {
      dispatch(fetchMessages({ 
        conversationId: activeConversation._id,
        limit: 50 
      }));
    }
    setShowInlineAttachment(false);
    toast.success('Files sent successfully!');
    
    // Trigger notification update events
    window.dispatchEvent(new CustomEvent('new_message', { 
      detail: { conversationId: activeConversation._id } 
    }));
    localStorage.setItem('new_message_notification', Date.now().toString());
    setTimeout(() => localStorage.removeItem('new_message_notification'), 1000);
    
    // Play send sound
    if (window.playMessageSentSound) {
      window.playMessageSentSound();
    }
  };

  const handleAudioSent = (message) => {
    // Audio was sent successfully, refresh messages
    if (activeConversation) {
      dispatch(fetchMessages({ 
        conversationId: activeConversation._id,
        limit: 50 
      }));
    }
    setShowInlineRecorder(false);
    toast.success('Voice message sent!');
    
    // Trigger notification update events
    window.dispatchEvent(new CustomEvent('new_message', { 
      detail: { conversationId: activeConversation._id } 
    }));
    localStorage.setItem('new_message_notification', Date.now().toString());
    setTimeout(() => localStorage.removeItem('new_message_notification'), 1000);
    
    // Play send sound
    if (window.playMessageSentSound) {
      window.playMessageSentSound();
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays < 7) {
        return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  // Get real online status for conversation participants
  const getOnlineStatus = (participantId) => {
    if (!participantId) {
      return { text: 'Unknown', color: 'bg-gray-400', isOnline: false };
    }

    const status = participantStatuses[participantId];
    if (!status) {
      return { text: 'Unknown', color: 'bg-gray-400', isOnline: false };
    }

    if (status.isOnline) {
      return { text: 'Online', color: 'bg-green-400', isOnline: true };
    }

    // Calculate time since last seen
    const now = new Date();
    const lastSeen = new Date(status.lastSeen);
    const timeDiff = Math.floor((now - lastSeen) / 1000); // seconds

    if (timeDiff < 60) {
      return { text: 'Last seen just now', color: 'bg-yellow-400', isOnline: false };
    } else if (timeDiff < 3600) {
      const minutes = Math.floor(timeDiff / 60);
      return { text: `Last seen ${minutes}m ago`, color: 'bg-gray-400', isOnline: false };
    } else if (timeDiff < 86400) {
      const hours = Math.floor(timeDiff / 3600);
      return { text: `Last seen ${hours}h ago`, color: 'bg-gray-400', isOnline: false };
    } else {
      const days = Math.floor(timeDiff / 86400);
      return { text: `Last seen ${days}d ago`, color: 'bg-gray-400', isOnline: false };
    }
  };

  // Fetch conversations on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchConversations({ limit: 50 }));
      
      // Initial status check for participants
      setTimeout(() => {
        checkParticipantStatuses();
      }, 1000);
    }
  }, [dispatch, user?.id]);

  // Mark user as offline when leaving the page
  useEffect(() => {
    const markOffline = async () => {
      if (user?.id) {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/common/messaging/offline`,
            {},
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
        } catch (error) {
          // Silent error - page is unloading anyway
        }
      }
    };

    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      markOffline(); // Also mark offline when component unmounts
    };
  }, [user?.id]);

  // Show initialization error
  if (initError) {
    const isMessagingDisabled = initError === 'MESSAGING_DISABLED';
    
    return (
      <div className="h-full w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          {isMessagingDisabled ? (
            <>
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Messaging System Disabled</h3>
              <p className="text-gray-600 mb-4">
                The messaging system is currently disabled for maintenance and security purposes. 
                Please contact your administrator if you need access to messaging features.
              </p>
              <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded-lg">
                <strong>For Administrators:</strong> To enable messaging, set <code>MESSAGING_SYSTEM_ENABLED=true</code> and <code>ENABLE_NEW_FEATURES=true</code> in your environment variables.
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading && conversations.length === 0 && !hasInitialized) {
    return (
      <div className="h-full w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messaging...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50 flex">
      {/* Sound Notifications */}
      <SoundNotifications />
      
      {/* Conversations Sidebar */}
      <div className={`${
        showConversations ? 'flex' : 'hidden'
      } lg:flex lg:w-1/3 w-full bg-white border-r border-gray-200 flex-col relative shadow-sm`}>
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900">Messages</h1>
                <p className="text-sm text-gray-600">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2.5 py-1 min-w-[24px] text-center shadow-sm">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <button
              onClick={() => dispatch(setShowNewChatModal(true))}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={!availableUsers?.length}
              title="Start new conversation"
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm"
            />
          </div>
        </div>

        {/* Conversations List - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
          {filteredConversations?.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {conversations?.length === 0 ? 'No conversations yet' : 'No matches found'}
              </h3>
              <p className="text-gray-500 text-sm">
                {conversations?.length === 0 
                  ? 'Start a new conversation to get connected with your team'
                  : 'Try adjusting your search terms'
                }
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations?.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                const unreadCount = conversation?.unreadCounts?.find(u => u.user === user?.id)?.count || 0;
                const isActive = activeConversation?._id === conversation._id;
                const hasUnread = unreadCount > 0;

                // Unread highlighting and badge system working! 🎯
                
                return (
                  <motion.div
                    key={conversation._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-2 p-3 lg:p-4 cursor-pointer rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : hasUnread
                          ? 'bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 shadow-sm'
                          : 'bg-white hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 relative">
                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-blue-500' : 'bg-gradient-to-br from-blue-400 to-purple-500'
                        }`}>
                          <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                        {unreadCount > 0 && !isActive && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`truncate ${
                            hasUnread && !isActive ? 'font-bold text-blue-900' : 
                            isActive ? 'font-semibold text-white' : 'font-semibold text-gray-900'
                          }`}>
                            {otherUser?.userName || 'Unknown User'}
                          </p>
                          <div className="flex items-center space-x-2">
                            {conversation?.lastMessage?.sentAt && (
                              <span className={`text-xs whitespace-nowrap ${
                                hasUnread && !isActive ? 'font-semibold text-blue-700' :
                                isActive ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(conversation.lastMessage.sentAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-sm truncate mb-2 ${
                          hasUnread && !isActive ? 'font-semibold text-blue-800' :
                          isActive ? 'text-blue-100' : 'text-gray-600'
                        }`}>
                          {conversation?.lastMessage?.content || 'Start a conversation...'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            otherUser?.role === 'superAdmin' 
                              ? isActive ? 'bg-purple-400 text-white' : 'bg-purple-100 text-purple-800'
                              : isActive ? 'bg-green-400 text-white' : 'bg-green-100 text-green-800'
                          }`}>
                            {otherUser?.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                          </span>
                          {unreadCount > 0 && isActive && (
                            <span className="bg-white text-blue-600 text-xs font-semibold rounded-full px-2 py-1">
                              {unreadCount} new
                            </span>
                          )}
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
      } lg:flex flex-1 flex-col bg-gray-50 h-full`}>
        {activeConversation ? (
          <>
            {/* Conversation Header - Fixed */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back Button for Mobile */}
                  <button
                    onClick={() => setShowConversations(true)}
                    className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded-md"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  {/* Conversation Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                        {activeConversation?.title || 'Conversation'}
                      </h3>
                      {/* Show online status of other participant */}
                      {activeConversation?.participants && (
                        <div className="flex items-center space-x-1">
                          {(() => {
                            const otherParticipant = activeConversation.participants.find(p => {
                              const participantId = p.user?._id || p.user;
                              return participantId !== user?.id;
                            });
                            
                            if (otherParticipant) {
                              const participantId = otherParticipant.user?._id || otherParticipant.user;
                              const onlineStatus = getOnlineStatus(participantId);
                              return (
                                <>
                                  <span className={`w-2 h-2 ${onlineStatus.color} rounded-full${onlineStatus.isOnline ? ' animate-pulse' : ''}`}></span>
                                  <span className="text-sm text-gray-500">{onlineStatus.text}</span>
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 space-y-4">
              {messagesLoading && messages?.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">Loading messages...</span>
                  </div>
                </div>
              ) : messages?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-500">Start the conversation by sending your first message!</p>
                </div>
              ) : (
                messages?.map((message, index) => {
                  const isOwn = message?.sender?._id === user?.id;
                  const showAvatar = index === 0 || messages[index - 1]?.sender?._id !== message?.sender?._id;
                  
                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`flex items-end space-x-2 max-w-[85%] sm:max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isOwn && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${showAvatar ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 'invisible'}`}>
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className={`rounded-2xl shadow-sm ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-lg'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-lg'
                        }`}>
                          {/* Render different message types */}
                          {message?.messageType === 'audio' && message?.attachments?.length > 0 ? (
                            <div className="p-2">
                              <VoiceMessagePlayer
                                audioUrl={message.attachments[0].fileUrl}
                                duration={message.attachments[0].duration}
                                className={isOwn ? 'voice-message-own' : 'voice-message-other'}
                              />
                              {message?.content && message.content !== '🎤 Voice message' && (
                                <p className="text-xs mt-2 opacity-75">{message.content}</p>
                              )}
                            </div>
                          ) : message?.messageType === 'image' && message?.attachments?.length > 0 ? (
                            <div className="p-2">
                              <img
                                src={message.attachments[0].fileUrl}
                                alt={message.attachments[0].originalName || 'Image'}
                                className="max-w-full h-auto rounded-lg cursor-pointer"
                                style={{ maxHeight: '250px', minHeight: '100px' }}
                                onClick={() => {
                                  const isMobile = window.innerWidth <= 768;
                                  if (isMobile) {
                                    // On mobile, open in same tab for better UX
                                    window.location.href = message.attachments[0].fileUrl;
                                  } else {
                                    // On desktop, open in new tab
                                    window.open(message.attachments[0].fileUrl, '_blank');
                                  }
                                }}
                              />
                              {message?.content && (
                                <p className="text-sm mt-2">{message.content}</p>
                              )}
                            </div>
                          ) : message?.messageType === 'file' && message?.attachments?.length > 0 ? (
                            <div className="p-3">
                              <a
                                href={message.attachments[0].fileUrl}
                                download={message.attachments[0].originalName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-3 text-blue-500 hover:text-blue-700 active:text-blue-800 transition-colors min-h-[44px] touch-manipulation"
                              >
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Paperclip className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{message.attachments[0].originalName}</p>
                                  <p className="text-xs text-gray-500">Tap to download</p>
                                </div>
                              </a>
                              {message?.content && (
                                <p className="text-sm mt-2">{message.content}</p>
                              )}
                            </div>
                          ) : (
                            <div className="px-4 py-3">
                              <p className="text-sm leading-relaxed">{message?.content || ''}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-end pb-1 ${isOwn ? 'mr-2' : 'ml-2'}`}>
                        <div className="flex flex-col items-end space-y-1">
                          <span>
                            {message?.createdAt ? formatTime(message.createdAt) : ''}
                          </span>
                          {isOwn && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 text-blue-500" />
                              <span className="text-xs">Sent</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Message Input, Voice Recorder, or Attachment Menu - Fixed */}
            <div className="flex-shrink-0">
              {showInlineRecorder ? (
                <InlineVoiceRecorder
                  isVisible={showInlineRecorder}
                  onClose={() => setShowInlineRecorder(false)}
                  onSendAudio={handleAudioSent}
                  conversationId={activeConversation?._id}
                />
              ) : showInlineAttachment ? (
                <InlineAttachmentMenu
                  isVisible={showInlineAttachment}
                  onClose={() => setShowInlineAttachment(false)}
                  onSendFiles={handleFileUpload}
                  conversationId={activeConversation?._id}
                />
              ) : (
                <div className="bg-white p-3 sm:p-4 lg:p-6 border-t border-gray-200 safe-area-inset-bottom">
                  <div className="flex items-end space-x-2 sm:space-x-3">
                    {/* File Upload Button */}
                    <button 
                      onClick={() => setShowInlineAttachment(true)}
                      className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors touch-manipulation" 
                      title="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    {/* Voice Recording Button */}
                    <button 
                      onClick={() => setShowInlineRecorder(true)}
                      className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors touch-manipulation" 
                      title="Record voice message"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 relative">
                      <div className="relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message here..."
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-base placeholder-gray-500 resize-none touch-manipulation"
                          disabled={sendingMessage}
                        />
                        {sendingMessage && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 px-2 hidden sm:block">
                        Press Enter to send • Shift + Enter for new line
                      </div>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:hover:shadow-sm touch-manipulation"
                      title="Send message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center max-w-md">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white animate-pulse"></div>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">Welcome to Messaging</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Select a conversation from the sidebar to start chatting, or click the 
                <span className="inline-flex items-center mx-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  <Plus className="w-3 h-3 mr-1" />
                  plus
                </span> 
                button to start a new conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => dispatch(setShowNewChatModal(true))}
                  disabled={!availableUsers?.length}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Start New Chat</span>
                </button>
                <div className="text-sm text-gray-500 flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>{availableUsers?.length || 0} users available</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-transparent z-40"
              onClick={() => dispatch(setShowNewChatModal(false))}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 z-50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Start New Chat</h2>
                    <p className="text-sm text-gray-600 mt-1">Select a team member to chat with</p>
                  </div>
                  <button
                    onClick={() => dispatch(setShowNewChatModal(false))}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableUsers?.map((availableUser) => (
                    <div
                      key={availableUser._id}
                      onClick={() => handleStartNewConversation(availableUser._id, availableUser.userName)}
                      className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{availableUser.userName}</p>
                        <p className="text-xs text-gray-500">
                          {availableUser.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {(!availableUsers || availableUsers.length === 0) && (
                    <div className="text-center text-gray-500 py-8">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">No users available for messaging</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>




    </div>
  );
};

export default MessagingDashboard; 