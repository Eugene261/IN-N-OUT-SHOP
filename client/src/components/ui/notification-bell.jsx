import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, MessageSquare, AlertCircle, CheckCircle, User, Clock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectTotalUnread, fetchConversations } from '../../store/common/messaging-slice';
import UserAvatar from '../common/messaging/UserAvatar';

const NotificationBell = ({ className = "" }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);
  const prevUnreadCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  
  // Redux selectors
  const unreadCount = useSelector(selectTotalUnread) || 0;
  const conversations = useSelector(state => state.messaging?.conversations || []);
  const { user } = useSelector(state => state.auth);
  const messagingError = useSelector(state => state.messaging?.error);
  
  console.log('🔔 NotificationBell Redux State:', {
    unreadCount,
    conversationsCount: conversations.length,
    user: user?.userName,
    userRole: user?.role,
    messagingError,
    hasToken: !!localStorage.getItem('token'),
    tokenPreview: localStorage.getItem('token')?.substring(0, 20) + '...'
  });

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial fetch and real-time polling for updates with smart error handling
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
      console.log('🔔 NotificationBell: User not valid for messaging', { user: user?.userName, role: user?.role });
      return;
    }

    // Check if we have a valid token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔔 NotificationBell: No auth token found');
      return;
    }

    let authErrorCount = 0;
    let consecutiveNetworkErrors = 0;
    let isComponentMounted = true;
    let timeoutId = null;
    const MAX_AUTH_ERRORS = 3;

    const pollForUpdates = async () => {
      if (!isComponentMounted) return 'stop';

      try {
        await dispatch(fetchConversations()).unwrap();
        authErrorCount = 0; // Reset on success
        consecutiveNetworkErrors = 0; // Reset network errors on success
        console.log('🔔 NotificationBell: Successfully fetched conversations');
        
        // SMART POLLING: Fast when active, slow when idle
        const isUserActive = document.hasFocus() && !document.hidden;
        const pollInterval = isUserActive ? 30000 : 120000; // 30s when active, 2min when idle
        scheduleNextPoll(pollInterval);
        return 'continue';
      } catch (error) {
        if (!isComponentMounted) return 'stop';

        // FIXED: Handle authentication errors gracefully
        if (error.response?.status === 401) {
          authErrorCount++;
          console.log(`🔔 NotificationBell: Authentication failed (${authErrorCount}/${MAX_AUTH_ERRORS})`);
          
          if (authErrorCount >= MAX_AUTH_ERRORS) {
            console.log('🔔 NotificationBell: Too many auth errors, stopping polling');
            return 'stop'; // Stop polling after multiple auth failures
          }
          
          // For auth errors, wait much longer before retrying
          scheduleNextPoll(120000); // Wait 2 minutes for auth issues
          return 'auth_error';
        } else if (error.response?.status === 500 && 
                  (error.response?.data?.error === 'BSON_SIZE_LIMIT_EXCEEDED' ||
                   error.response?.data?.message?.includes('Document size too large'))) {
          
          console.error('🔔 NotificationBell: BSON size limit exceeded - database documents too large');
          console.error('🔔 This is likely due to large avatar images stored in the database');
          
          // For BSON size errors, wait much longer and eventually stop polling
          authErrorCount++;
          if (authErrorCount >= MAX_AUTH_ERRORS) {
            console.log('🔔 NotificationBell: Too many BSON size errors, stopping polling until fixed');
            return 'stop';
          }
          
          scheduleNextPoll(300000); // Wait 5 minutes for BSON size issues
          return 'bson_size_error';
        } else if (!navigator.onLine || 
                  error.code === 'ERR_NETWORK' || 
                  error.code === 'ERR_INTERNET_DISCONNECTED' ||
                  error.message?.includes('Network Error')) {
          
          consecutiveNetworkErrors++;
          console.log(`🔔 NotificationBell: Network error (${consecutiveNetworkErrors})`);
          
          if (consecutiveNetworkErrors >= 5) {
            console.log('🔔 NotificationBell: Too many network errors, stopping polling');
            return 'stop';
          }
          
          // Use exponential backoff for network errors
          const backoffDelay = Math.min(5000 * Math.pow(2, consecutiveNetworkErrors - 1), 60000);
          scheduleNextPoll(backoffDelay);
          return 'network_error';
        } else {
          console.error('🔔 NotificationBell: Unexpected error:', error);
          scheduleNextPoll(180000); // Much longer delay (3 minutes) for unexpected errors
          return 'error';
        }
      }
    };

    const scheduleNextPoll = (delay) => {
      if (!isComponentMounted) return;
      
      timeoutId = setTimeout(async () => {
        if (isComponentMounted) {
          await pollForUpdates();
        }
      }, delay);
    };

    // Initial fetch
    pollForUpdates();

    return () => {
      isComponentMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [dispatch, user]);

  // ENHANCED: Real-time message events + visibility/focus detection
  useEffect(() => {
    const handleNewMessage = (event) => {
      console.log('🔔 NotificationBell: New message received, refreshing conversations');
      dispatch(fetchConversations());
      
      // Play receive sound for incoming messages
      if (window.playMessageReceivedSound) {
        window.playMessageReceivedSound();
        console.log('🔔 NotificationBell: Playing receive sound');
      }
    };

    const handleStorageChange = (event) => {
      // Listen for localStorage changes from other tabs
      if (event.key === 'new_message_notification') {
        console.log('🔔 NotificationBell: Cross-tab message notification, refreshing');
        dispatch(fetchConversations());
        
        // Play receive sound for cross-tab notifications
        if (window.playMessageReceivedSound) {
          window.playMessageReceivedSound();
          console.log('🔔 NotificationBell: Playing receive sound (cross-tab)');
        }
      }
    };

    // SMART POLLING: Faster refresh when user becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden && document.hasFocus()) {
        console.log('🔔 NotificationBell: User became active, immediate refresh');
        dispatch(fetchConversations()); // Immediate refresh when user becomes active
      }
    };

    const handleFocus = () => {
      console.log('🔔 NotificationBell: Window focused, immediate refresh');
      dispatch(fetchConversations()); // Immediate refresh when window is focused
    };

    // Listen for custom events
    window.addEventListener('new_message', handleNewMessage);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('new_message', handleNewMessage);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [dispatch]);

  // Convert conversations to notifications - FIXED: Remove circular dependency
  useEffect(() => {
    const currentUnreadCount = unreadCount;
    
    console.log('🔔 NotificationBell: Processing conversations', {
      conversationsCount: conversations.length,
      user: user?.userName,
      userId: user?.id,
      currentUnreadCount,
      previousUnreadCount: prevUnreadCountRef.current,
      conversationsWithUnread: conversations.filter(conv => 
        conv.unreadCounts?.some(u => {
          const unreadUserId = u.user?._id || u.user;
          const currentUserId = user?.id;
          return unreadUserId?.toString() === currentUserId?.toString() && u.count > 0;
        })
      ).length
    });

    // Play receive sound if unread count increased (new messages arrived)
    // Skip sound on initial load
    if (!isInitialLoadRef.current && currentUnreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current >= 0) {
      if (window.playMessageReceivedSound) {
        window.playMessageReceivedSound();
        console.log('🔔 NotificationBell: Playing receive sound for increased unread count');
      }
    }
    
    // Update the previous unread count and mark as not initial load
    prevUnreadCountRef.current = currentUnreadCount;
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }

    if (!conversations.length || !user?.id) {
      console.log('🔔 NotificationBell: No conversations or user found');
      setNotifications([]);
      return;
    }

    const notificationList = conversations
      .filter(conv => {
        // Find unread count for current user
        // Handle both populated and non-populated user references
        const userUnread = conv.unreadCounts?.find(u => {
          const unreadUserId = u.user?._id || u.user;
          const currentUserId = user?.id;
          return unreadUserId?.toString() === currentUserId?.toString();
        });
        const hasUnread = userUnread && userUnread.count > 0;
        
        console.log('🔔 Conversation filter:', {
          convId: conv._id,
          userUnread: userUnread?.count || 0,
          hasUnread,
          lastMessage: conv.lastMessage?.content?.substring(0, 20),
          participants: conv.participants?.map(p => ({ id: p.user._id, name: p.user.userName })),
          unreadCounts: conv.unreadCounts?.map(u => ({
            userId: u.user?._id || u.user,
            userName: u.user?.userName,
            count: u.count
          })),
          currentUserId: user?.id,
          updatedAt: conv.updatedAt
        });
        
        return hasUnread;
      })
      .map(conv => {
        const otherParticipant = conv.participants.find(p => p.user._id !== user?.id);
        const userUnread = conv.unreadCounts?.find(u => {
          const unreadUserId = u.user?._id || u.user;
          const currentUserId = user?.id;
          return unreadUserId?.toString() === currentUserId?.toString();
        });
        
        return {
          id: conv._id,
          type: 'message',
          title: `New message from ${otherParticipant?.user?.userName || 'Unknown'}`,
          message: conv.lastMessage?.content || 'New message received',
          time: conv.lastMessage?.sentAt || conv.updatedAt,
          count: userUnread?.count || 0,
          avatar: otherParticipant?.user?.avatar,
          role: otherParticipant?.user?.role,
          link: user?.role === 'admin' ? '/admin/messaging' : '/super-admin/messaging'
        };
      })
      .sort((a, b) => new Date(b.time) - new Date(a.time));

    console.log('🔔 NotificationBell: Processed notifications:', {
      notificationsCount: notificationList.length,
      notifications: notificationList.map(n => ({
        title: n.title,
        count: n.count
      }))
    });

    // FIXED: Use a stable comparison method instead of relying on state
    setNotifications(prevNotifications => {
      // Check if notifications actually changed
      if (prevNotifications.length !== notificationList.length) {
        return notificationList;
      }
      
      // Check if any notification content changed
      const hasChanged = notificationList.some((newNotif, index) => {
        const prevNotif = prevNotifications[index];
        return !prevNotif || 
               prevNotif.id !== newNotif.id || 
               prevNotif.count !== newNotif.count ||
               prevNotif.title !== newNotif.title;
      });
      
      if (hasChanged) {
        // Check for truly new notifications (only if we had previous notifications)
        if (prevNotifications.length > 0) {
          const currentNotificationIds = new Set(prevNotifications.map(n => n.id));
          const hasNewNotifications = notificationList.some(n => !currentNotificationIds.has(n.id));
          
          if (hasNewNotifications) {
            setHasNewNotification(true);
            playNotificationSound();
            console.log('🔔 NotificationBell: New notification detected!');
          }
        }
        
        return notificationList;
      }
      
      // No changes, return previous state
      return prevNotifications;
    });
  }, [conversations, user?.id, unreadCount]); // FIXED: Removed notifications dependency

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a subtle notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const time = new Date(dateString);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Handle bell click
  const handleBellClick = () => {
    setIsOpen(!isOpen);
    setHasNewNotification(false);
  };

  const totalNotifications = unreadCount;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <motion.button
        ref={bellRef}
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Bell Icon */}
        <motion.div
          animate={hasNewNotification ? {
            rotate: [-10, 10, -10, 10, 0],
            transition: { duration: 0.5 }
          } : {}}
        >
          <Bell className="w-6 h-6" />
        </motion.div>

        {/* Notification Count Badge */}
        <AnimatePresence>
          {totalNotifications > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {totalNotifications > 99 ? '99+' : totalNotifications}
            </motion.span>
          )}
        </AnimatePresence>

        {/* New notification indicator (red dot) */}
        <AnimatePresence>
          {hasNewNotification && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Dropdown - MOBILE RESPONSIVE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 sm:w-80 lg:w-96 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {totalNotifications > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  You have {totalNotifications} unread message{totalNotifications !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No new notifications</p>
                  <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <Link
                      to={notification.link}
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar or Icon */}
                        <div className="flex-shrink-0">
                          <UserAvatar 
                            user={{
                              userName: notification.title.replace('New message from ', ''),
                              avatar: notification.avatar,
                              role: notification.role
                            }}
                            size="sm"
                            showOnlineIndicator={false}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            {notification.count > 0 && (
                              <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {notification.count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimeAgo(notification.time)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <Link
                  to={user?.role === 'admin' ? '/admin/messaging' : '/super-admin/messaging'}
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all messages
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
