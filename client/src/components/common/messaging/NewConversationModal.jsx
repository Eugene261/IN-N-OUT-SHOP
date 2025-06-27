import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  User, 
  MessageSquare, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAvailableUsers,
  setShowNewChatModal,
  selectAvailableUsers,
  selectLoading
} from '../../../store/common/messaging-slice';

const NewConversationModal = ({ isOpen, onClose, onStartConversation }) => {
  const dispatch = useDispatch();
  const availableUsers = useSelector(selectAvailableUsers);
  const loading = useSelector(selectLoading);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Load available users when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAvailableUsers());
    }
  }, [isOpen, dispatch]);

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartConversation = (user) => {
    onStartConversation(user._id, user.userName);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedUser(null);
    onClose();
  };

  const formatLastActive = (lastActive) => {
    if (!lastActive) return 'Never active';
    
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));
    
    if (diffMinutes < 5) return 'Online';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const isOnline = (lastActive) => {
    if (!lastActive) return false;
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));
    return diffMinutes < 5;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Start New Conversation</h2>
              <p className="text-sm text-gray-500 mt-1">Choose someone to chat with</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium">Loading users...</span>
                </div>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <motion.div
                    key={user._id}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    className="p-4 cursor-pointer transition-colors"
                    onClick={() => handleStartConversation(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        {isOnline(user.lastActive) && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {user.userName}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.role === 'superAdmin' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {user.email}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            isOnline(user.lastActive) ? 'bg-green-400' : 'bg-gray-300'
                          }`}></div>
                          <p className="text-xs text-gray-400">
                            {formatLastActive(user.lastActive)}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No users found' : 'No users available'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : 'There are no users available to start conversations with'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} available</span>
              <span>Click a user to start chatting</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewConversationModal; 