import React from 'react';
import { useSelector } from 'react-redux';
import { selectTotalUnread } from '../../store/common/messaging-slice';

const NotificationBadge = ({ className = "", showZero = false }) => {
  const unreadCount = useSelector(selectTotalUnread) || 0;

  // Ensure unreadCount is a valid number
  const validUnreadCount = typeof unreadCount === 'number' && !isNaN(unreadCount) ? unreadCount : 0;

  // Debug logging
  console.log('🔔 NotificationBadge render:', { 
    unreadCount, 
    validUnreadCount, 
    showZero, 
    willShow: showZero || validUnreadCount > 0 
  });

  if (!showZero && validUnreadCount === 0) {
    return null;
  }

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