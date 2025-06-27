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

  // Track conversations with ref to prevent infinite loops
  const conversationsRef = useRef(conversations);
  
  // Update ref when conversations change (but don't trigger effects)
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

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
    // Show error notifications - FIXED: Don't show auth errors from background processes
    if (error) {
      // Skip showing toast for authentication-related errors from background processes
      const isAuthError = error.includes('Unauthorized') || 
                          error.includes('Authentication') || 
                          error.includes('Invalid token') ||
                          error.includes('token expired');
      
      if (!isAuthError) {
        toast.error(error);
      } else {
        console.log('🔔 Skipping auth error toast:', error);
      }
      
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
            if (!token) {
              console.log('🔔 No token available for heartbeat, skipping');
              return;
            }
            
            await axios.post(
              `${import.meta.env.VITE_API_URL}/api/common/messaging/heartbeat`,
              {},
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
          } catch (error) {
            // FIXED: Handle authentication errors gracefully without toasts
            if (error.response?.status === 401) {
              console.log('🔔 Heartbeat authentication failed, token may be expired');
              // Clear intervals to stop making failing requests
              if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
              }
              if (statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current);
                statusCheckIntervalRef.current = null;
              }
              // Don't show error toast - let axios interceptor handle token expiration
              return;
            }
            
            // Only log non-auth errors
            if (error.response?.status !== 401) {
              console.log('⚠️ Heartbeat failed:', error.message);
            }
          }
        }
      }, 30000); // Every 30 seconds
    };

    // Check online status of conversation participants every 2 minutes (reduced frequency)
    const startStatusCheck = () => {
      statusCheckIntervalRef.current = setInterval(async () => {
        if (navigator.onLine && conversationsRef.current?.length > 0) {
          await checkParticipantStatuses();
        }
      }, 120000); // Every 2 minutes to prevent overloading mobile
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
  }, [user?.id]); // REMOVED conversations dependency to prevent infinite loop

  // Check online status of conversation participants
  const checkParticipantStatuses = async () => {
    // Use ref to get current conversations without dependency issues
    const currentConversations = conversationsRef.current;
    if (!currentConversations?.length) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔔 No token available for status check, skipping');
        return;
      }
      
      const allParticipants = new Set();
      
      // Collect all unique participant IDs
      currentConversations.forEach(conv => {
        conv.participants?.forEach(p => {
          const participantId = p.user?._id || p.user;
          if (participantId && participantId !== user?.id) {
            allParticipants.add(participantId);
          }
        });
      });

      if (allParticipants.size === 0) return;

      // Check status for each participant with timeout
      const statusPromises = Array.from(allParticipants).slice(0, 10).map(async (participantId) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/common/messaging/users/${participantId}/status`,
            {
              headers: { 'Authorization': `Bearer ${token}` },
              signal: controller.signal
            }
          );
          
          clearTimeout(timeoutId);
          return { participantId, status: response.data.data };
        } catch (error) {
          // FIXED: Handle 401 errors without logging as failures
          if (error.response?.status === 401) {
            console.log('🔔 Status check authentication failed for participant:', participantId);
            // Return offline status for auth failures (don't treat as error)
            return { participantId, status: { isOnline: false, lastSeen: new Date() } };
          }
          
          // Return offline status for other failed requests (network, timeout, etc.)
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
      // FIXED: Only log non-authentication errors
      if (error.response?.status !== 401) {
        console.error('Error checking participant statuses:', error);
      } else {
        console.log('🔔 Participant status check authentication failed, stopping status checks');
        // Stop status checking if authentication fails
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
      }
      // Don't crash the app, just log the error
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
      // FIXED: Complete null safety to prevent crashes
      if (!conversation || !conversation.participants || !Array.isArray(conversation.participants)) {
        return null;
      }
      
      const participant = conversation.participants.find(p => {
        // Safe property access
        if (!p || !p.user) return false;
        
        const participantId = p.user._id || p.user;
        const currentUserId = user?.id;
        
        return participantId && currentUserId && participantId.toString() !== currentUserId.toString();
      });
      
      return participant?.user || null;
    } catch (err) {
      console.error('Error getting other participant:', err);
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

  // Initial status check when conversations are loaded (only once)
  useEffect(() => {
    if (conversations?.length > 0 && hasInitialized) {
      // Delay initial status check to avoid overwhelming mobile
      const timeoutId = setTimeout(() => {
        checkParticipantStatuses();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasInitialized]); // Only run when initialized, not on every conversation change

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
          // Silent error - page is closing anyway
          console.log('⚠️ Failed to mark offline:', error.message);
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
      
      // Clean up all intervals and timeouts
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [user?.id]);

  // Safe error boundary wrapper
  const renderMessagingInterface = () => {
    try {
      // Early return for any critical missing data
      if (!user?.id) {
        return (
          <div className="h-full w-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
              <p className="text-gray-600">Please log in to access messaging.</p>
            </div>
          </div>
        );
      }

      return (
        <>
          {/* Main Container */}
          {initError ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md bg-red-50 border border-red-200 rounded-lg p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Messaging</h3>
                <p className="text-red-700 mb-4">{initError}</p>
                <button
                  onClick={() => {
                    setInitError(null);
                    setHasInitialized(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !hasInitialized ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center space-x-3 text-blue-600">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-lg font-medium">Loading messaging...</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Conversations Sidebar */}
              <div className={`${
                showConversations ? 'flex' : 'hidden'
              } lg:flex lg:w-1/3 w-full bg-white border-r border-gray-200 flex-col relative shadow-sm`}>
                {/* Header */}
                <div className="p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-lg lg:text-xl font-bold text-gray-900">Messages</h1>
                        <p className="text-xs lg:text-sm text-gray-600">
                          {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch(setShowNewChatModal(true))}
                      className="p-2 lg:p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm hover:shadow-md touch-manipulation"
                      title="Start new conversation"
                    >
                      <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-9 lg:pl-10 pr-3 py-2 lg:py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base touch-manipulation"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                    />
                  </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations && filteredConversations.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {(filteredConversations || []).map((conversation) => {
                        try {
                          // FIXED: Safe conversation data extraction
                          if (!conversation || !conversation._id) {
                            return null; // Skip invalid conversations
                          }
                          
                          const otherUser = getOtherParticipant(conversation) || { userName: 'Unknown User' };
                          
                          // Safe unread count calculation
                          let unreadCount = 0;
                          try {
                            const userUnread = conversation.unreadCounts?.find(u => {
                              if (!u || !u.user) return false;
                              const unreadUserId = u.user._id || u.user;
                              return unreadUserId && user?.id && unreadUserId.toString() === user.id.toString();
                            });
                            unreadCount = userUnread?.count || 0;
                          } catch (unreadError) {
                            console.warn('Error calculating unread count:', unreadError);
                          }
                          
                          const isActive = activeConversation?._id === conversation._id;
                          const hasUnread = unreadCount > 0;
                          
                          // Safe last message content
                          const lastMessageContent = conversation.lastMessage?.content || 'No messages yet';
                          const lastMessageTime = conversation.lastMessage?.createdAt || conversation.updatedAt;

                          return (
                            <motion.div
                              key={conversation._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`p-3 lg:p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 ${
                                isActive ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                              } ${hasUnread ? 'bg-blue-50/50' : ''}`}
                              onClick={() => handleConversationSelect(conversation)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                                    {(otherUser.userName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h3 className={`text-sm lg:text-base font-medium truncate ${
                                      hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-900'
                                    }`}>
                                      {otherUser.userName || 'Unknown User'}
                                    </h3>
                                    {hasUnread && (
                                      <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                                        {unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs lg:text-sm truncate mt-1 ${
                                    hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
                                  }`}>
                                    {lastMessageContent}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {lastMessageTime ? formatTime(lastMessageTime) : ''}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        } catch (conversationError) {
                          console.error('Error rendering conversation:', conversationError);
                          return null; // Skip problematic conversations
                        }
                      }).filter(Boolean) /* Remove null entries */}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
                      <p className="text-gray-500 mb-4">Start a new conversation to get started!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className={`${
                showConversations ? 'hidden' : 'flex'
              } lg:flex flex-1 flex-col bg-white relative`}>
                {activeConversation ? (
                  <>
                    {/* Conversation Header - Fixed at Top */}
                    <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
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
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {getOtherParticipant(activeConversation)?.userName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                                {getOtherParticipant(activeConversation)?.userName || 'Unknown User'}
                              </h2>
                              {/* Online Status */}
                              <div className="flex items-center space-x-2 text-xs lg:text-sm">
                                {(() => {
                                  const otherParticipant = getOtherParticipant(activeConversation);
                                  const status = getOnlineStatus(otherParticipant?._id || otherParticipant?.id);
                                  return (
                                    <div className="flex items-center space-x-1">
                                      <div className={`w-2 h-2 rounded-full ${status.color} ${status.isOnline ? 'animate-pulse' : ''}`}></div>
                                      <span className="text-gray-500">{status.text}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Messages - Scrollable Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 space-y-4 scroll-smooth">
                      {messagesLoading && (!messages || messages.length === 0) ? (
                        <div className="flex justify-center py-8">
                          <div className="flex items-center space-x-2 text-blue-600">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="text-sm font-medium">Loading messages...</span>
                          </div>
                        </div>
                      ) : (!messages || messages.length === 0) ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                          <p className="text-gray-500">Start the conversation by sending your first message!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message, index) => {
                            const isOwnMessage = message?.sender?._id === user?.id || message?.sender?.toString() === user?.id;
                            const showAvatar = index === 0 || messages[index - 1]?.sender?._id !== message?.sender?._id;

                            return (
                              <motion.div
                                key={message._id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} space-x-2 lg:space-x-3`}
                              >
                                {!isOwnMessage && showAvatar && (
                                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                    {message?.sender?.userName?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                )}
                                {!isOwnMessage && !showAvatar && (
                                  <div className="w-8 h-8 flex-shrink-0"></div>
                                )}

                                <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl shadow-sm ${
                                  isOwnMessage 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}>
                                  {/* Handle different message types */}
                                  {message?.messageType === 'audio' && message?.attachments?.length > 0 ? (
                                    <div className="p-3">
                                      <VoiceMessagePlayer
                                        audioUrl={message.attachments[0].fileUrl}
                                        duration={message.attachments[0].duration}
                                        className={isOwnMessage ? 'audio-player-own' : 'audio-player-other'}
                                      />
                                      {message?.content && message.content !== '🎤 Voice message' && (
                                        <p className="text-sm mt-2">{message.content}</p>
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
                                          const isMobileDevice = window.innerWidth <= 768;
                                          if (isMobileDevice) {
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
                                  ) : (
                                    <div className="p-3 lg:p-4">
                                      <p className="text-sm lg:text-base leading-relaxed">
                                        {message?.content || 'Message content unavailable'}
                                      </p>
                                    </div>
                                  )}

                                  <div className={`px-3 lg:px-4 pb-2 text-xs ${
                                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {message?.createdAt ? formatTime(message.createdAt) : 'Unknown time'}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Message Input - Fixed at Bottom */}
                    {showInlineAttachment ? (
                      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                        <InlineAttachmentMenu
                          conversationId={activeConversation._id}
                          onClose={() => setShowInlineAttachment(false)}
                          onFilesSent={handleFileUpload}
                        />
                      </div>
                    ) : showInlineRecorder ? (
                      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                        <InlineVoiceRecorder
                          conversationId={activeConversation._id}
                          onClose={() => setShowInlineRecorder(false)}
                          onSendAudio={handleAudioSent}
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 bg-white p-3 sm:p-4 lg:p-6 border-t border-gray-200 safe-area-inset-bottom">
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      );
    } catch (error) {
      console.error('Error rendering messaging interface:', error);
      return (
        <div className="h-full w-full bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interface Error</h3>
            <p className="text-gray-600 mb-4">
              Something went wrong with the messaging interface. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] w-full bg-gray-50 flex rounded-lg shadow-sm overflow-hidden">
      {/* Sound Notifications */}
      <SoundNotifications />
      
      {/* Main Interface */}
      {renderMessagingInterface()}
    </div>
  );
};

export default MessagingDashboard; 