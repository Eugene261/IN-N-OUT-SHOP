import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, MessageSquare, AlertCircle, CheckCircle, User, Clock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectTotalUnread, fetchConversations } from '../../store/common/messaging-slice';

const NotificationBell = ({ className = "" }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);
  
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

  // Initial fetch and real-time polling for updates
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
    const MAX_AUTH_ERRORS = 3;

    const pollForUpdates = async () => {
      try {
        await dispatch(fetchConversations()).unwrap();
        authErrorCount = 0; // Reset on success
        console.log('🔔 NotificationBell: Successfully fetched conversations');
      } catch (error) {
        console.log('🔔 NotificationBell fetch failed:', error);
        
        // If it's an auth error, increment counter
        if (error?.response?.status === 401 || error?.message?.includes('Unauthorized')) {
          authErrorCount++;
          console.log(`🔔 NotificationBell: Auth error #${authErrorCount}/${MAX_AUTH_ERRORS}`);
          
          // Stop polling after too many auth errors to prevent spam
          if (authErrorCount >= MAX_AUTH_ERRORS) {
            console.log('🔔 NotificationBell: Too many auth errors, stopping polling');
            return 'stop';
          }
        }
      }
      return 'continue';
    };

    // Initial fetch
    pollForUpdates().then(result => {
      if (result === 'stop') return;

      // Only start polling if initial fetch succeeded or wasn't an auth error
      const interval = setInterval(async () => {
        const result = await pollForUpdates();
        if (result === 'stop') {
          clearInterval(interval);
        }
      }, 10000); // Reduced to 10 seconds to be less aggressive
      
      return () => clearInterval(interval);
    });

  }, [dispatch, user]);

  // Convert conversations to notifications
  useEffect(() => {
    console.log('🔔 NotificationBell: Processing conversations', {
      conversationsCount: conversations.length,
      user: user?.userName,
      userId: user?.id
    });

    if (!conversations.length) {
      console.log('🔔 NotificationBell: No conversations found');
      return;
    }

    const notificationList = conversations
      .filter(conv => {
        // Find unread count for current user
        const userUnread = conv.unreadCounts?.find(u => u.user === user?.id);
        const hasUnread = userUnread && userUnread.count > 0;
        
        console.log('🔔 Conversation filter:', {
          convId: conv._id,
          userUnread: userUnread?.count || 0,
          hasUnread,
          lastMessage: conv.lastMessage?.content?.substring(0, 20),
          participants: conv.participants?.map(p => ({ id: p.user._id, name: p.user.userName })),
          unreadCounts: conv.unreadCounts,
          updatedAt: conv.updatedAt
        });
        
        return hasUnread;
      })
      .map(conv => {
        const otherParticipant = conv.participants.find(p => p.user._id !== user?.id);
        const userUnread = conv.unreadCounts?.find(u => u.user === user?.id);
        
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

    console.log('🔔 NotificationBell: Final notifications', {
      notificationsCount: notificationList.length,
      previousCount: notifications.length,
      notifications: notificationList.map(n => ({
        title: n.title,
        count: n.count
      }))
    });

    // Check for new notifications
    if (notificationList.length > notifications.length) {
      setHasNewNotification(true);
      // Play notification sound (optional)
      playNotificationSound();
      console.log('🔔 NotificationBell: New notification detected!');
    }

    setNotifications(notificationList);
  }, [conversations, user, notifications.length]);

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

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
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
                          {notification.avatar ? (
                            <img
                              src={notification.avatar}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                              notification.role === 'superAdmin' ? 'bg-purple-500' : 'bg-blue-500'
                            }`}>
                              <User className="w-4 h-4" />
                            </div>
                          )}
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
