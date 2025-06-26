import React from 'react';
import { useSelector } from 'react-redux';
import { selectTotalUnread } from '../../store/common/messaging-slice';

const NotificationBadge = ({ className = "", showZero = false }) => {
  const unreadCount = useSelector(selectTotalUnread);

  if (!showZero && unreadCount === 0) {
    return null;
  }

  return (
    <span 
      className={`
        inline-flex items-center justify-center min-w-[18px] h-[18px] 
        text-xs font-medium text-white bg-red-500 rounded-full 
        ${className}
      `}
      aria-label={`${unreadCount} unread messages`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default NotificationBadge; 