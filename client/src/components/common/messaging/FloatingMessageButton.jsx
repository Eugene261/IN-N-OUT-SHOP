import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectTotalUnread } from '../../../store/common/messaging-slice';
import UserAvatar from './UserAvatar';

const FloatingMessageButton = ({ isOpen, onClick }) => {
  const totalUnread = useSelector(selectTotalUnread);
  const { user } = useSelector(state => state.auth);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <button
        onClick={onClick}
        className="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      >
        {/* Icon */}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
        </motion.div>

        {/* Unread Badge */}
        {!isOpen && totalUnread > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </motion.div>
        )}

        {/* Pulse animation for new messages */}
        {!isOpen && totalUnread > 0 && (
          <motion.div
            className="absolute inset-0 bg-blue-600 rounded-full opacity-75"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}

        {/* Tooltip */}
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          {isOpen ? 'Close Messages' : totalUnread > 0 ? `${totalUnread} new messages` : 'Messages'}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>
    </motion.div>
  );
};

export default FloatingMessageButton; 