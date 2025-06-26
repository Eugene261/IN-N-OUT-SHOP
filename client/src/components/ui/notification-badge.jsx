import React from 'react';
import { useSelector } from 'react-redux';
import { selectTotalUnread } from '../../store/common/messaging-slice';

const NotificationBadge = ({ className = "", showZero = false }) => {
  const unreadCount = useSelector(selectTotalUnread) || 0;

  // Debug logging to help identify the issue
  console.log('NotificationBadge render:', { 
    unreadCount, 
    type: typeof unreadCount,
    showZero,
    state: useSelector(state => state.messaging)
  });

  // Ensure unreadCount is a valid number
  const validUnreadCount = typeof unreadCount === 'number' && !isNaN(unreadCount) ? unreadCount : 0;

  // Debug: Badge working perfectly! 🎉
  console.log('NotificationBadge validUnreadCount:', validUnreadCount);

  if (!showZero && validUnreadCount === 0) {
    console.log('NotificationBadge: Hiding badge (count is 0)');
    return null;
  }

  console.log('NotificationBadge: Showing badge with count:', validUnreadCount);

  return (
    <span 
      className={`
        inline-flex items-center justify-center min-w-[18px] h-[18px] 
        text-xs font-medium text-white bg-red-500 rounded-full 
        ${className}
      `}
      aria-label={`${validUnreadCount} unread messages`}
    >
      {validUnreadCount > 99 ? '99+' : validUnreadCount}
    </span>
  );
};

export default NotificationBadge; 