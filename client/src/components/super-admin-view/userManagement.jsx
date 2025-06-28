import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchAllUsers, 
  fetchUsersByRole, 
  addUser, 
  updateUserRole, 
  deleteUser,
  clearError,
  clearSuccess
} from '../../store/super-admin/user-slice';
import { 
  User, 
  UserPlus, 
  Trash2, 
  Edit, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  X, 
  Filter,
  Search,
  Eye
} from 'lucide-react';

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, isLoading, error, success, actionType } = useSelector(state => state.superAdminUsers);
  
  // Form states
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    userName: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [editUser, setEditUser] = useState({
    userId: '',
    userName: '',
    email: '',
    role: ''
  });
  
  // Filter and search states
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);
  
  // Filter users based on search term
  useEffect(() => {
    if (!users) return;
    
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = users.filter(
        user => 
          user.userName.toLowerCase().includes(lowercaseSearch) ||
          user.email.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);
  
  useEffect(() => {
    if (success) {
      // Clear forms on success
      if (actionType === 'add') {
        setShowAddUserForm(false);
        setNewUser({
          userName: '',
          email: '',
          password: '',
          role: 'admin'
        });
      } else if (actionType === 'update') {
        setShowEditUserForm(false);
      }
      
      // Clear success message after 3 seconds
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, actionType, dispatch]);
  
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      dispatch(fetchAllUsers());
    } else {
      dispatch(fetchUsersByRole(filter));
    }
  };
  
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    dispatch(addUser(newUser));
  };
  
  const handleEditUserSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserRole({
      userId: editUser.userId,
      role: editUser.role
    }));
  };
  
  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      dispatch(deleteUser(userId));
    }
  };
  
  const openEditUserForm = (user) => {
    setEditUser({
      userId: user._id,
      userName: user.userName,
      email: user.email,
      role: user.role
    });
    setShowEditUserForm(true);
  };

  const handleViewProfile = (user) => {
    // Only allow viewing admin and superAdmin profiles
    if (['admin', 'superAdmin'].includes(user.role)) {
      navigate(`/super-admin/users/profile/${user._id}`);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
        <p className="text-gray-600">Manage administrators and user roles</p>
      </motion.div>
      
      {/* Success message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center"
          >
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-700">{success}</span>
            <button 
              onClick={() => dispatch(clearSuccess())}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center"
          >
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => dispatch(clearError())}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add New User Button */}
      <motion.div 
        className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100"
        variants={itemVariants}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowAddUserForm(true)}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add New User
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-2 text-sm rounded-md flex items-center whitespace-nowrap ${
              activeFilter === 'all' 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            All Users
          </button>
          <button
            onClick={() => handleFilterChange('superAdmin')}
            className={`px-3 py-2 text-sm rounded-md flex items-center whitespace-nowrap ${
              activeFilter === 'superAdmin' 
                ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Super Admins
          </button>
          <button
            onClick={() => handleFilterChange('admin')}
            className={`px-3 py-2 text-sm rounded-md flex items-center whitespace-nowrap ${
              activeFilter === 'admin' 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Admins
          </button>
          <button
            onClick={() => handleFilterChange('user')}
            className={`px-3 py-2 text-sm rounded-md flex items-center whitespace-nowrap ${
              activeFilter === 'user' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Regular Users
          </button>
        </div>
      </motion.div>
      
      {/* Add User Form */}
      <AnimatePresence>
        {showAddUserForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
                <button 
                  onClick={() => setShowAddUserForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddUserSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={newUser.userName}
                      onChange={(e) => setNewUser({...newUser, userName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={8}
                      placeholder="Must include uppercase, lowercase, and number"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="admin">Admin</option>
                      <option value="superAdmin">Super Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddUserForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    {isLoading && actionType === 'add' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit User Form */}
      <AnimatePresence>
        {showEditUserForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Edit User Role</h2>
                <button 
                  onClick={() => setShowEditUserForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditUserSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editUser.userName}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editUser.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={editUser.role}
                      onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superAdmin">Super Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditUserForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    {isLoading && actionType === 'update' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Role'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Users Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
                    <p className="mt-2 text-gray-500">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <motion.tr 
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.userName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 truncate block max-w-[200px]">{user.email}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'superAdmin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {['admin', 'superAdmin'].includes(user.role) && (
                          <button
                            onClick={() => handleViewProfile(user)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="View profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditUserForm(user)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          disabled={isLoading && actionType === 'delete'}
                          title="Delete user"
                        >
                          {isLoading && actionType === 'delete' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-6 py-12 text-center">
                    <User className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-lg font-medium text-gray-500">No users found</p>
                    <p className="text-sm text-gray-400">
                      {searchTerm
                        ? `No users matching "${searchTerm}" found`
                        : activeFilter !== 'all' 
                          ? `No users with role "${activeFilter}" found` 
                          : 'No users have been added yet'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserManagement;
