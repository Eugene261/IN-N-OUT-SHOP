import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchAllOrders, 
  fetchOrdersByAdmin, 
  setSelectedAdmin, 
  clearSelectedAdmin 
} from '../../store/super-admin/orders-slice';
import { fetchUsersByRole } from '../../store/super-admin/user-slice';
import { 
  ShoppingBag, 
  User, 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  Loader2, 
  Search, 
  Filter, 
  X, 
  AlertCircle 
} from 'lucide-react';

const SuperAdminOrders = () => {
  const dispatch = useDispatch();
  const { orders, filteredOrders, selectedAdmin, isLoading, error } = useSelector(state => state.superAdminOrders);
  const { users } = useSelector(state => state.superAdminUsers);
  
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});
  
  useEffect(() => {
    dispatch(fetchAllOrders())
      .then((action) => {
        if (action.payload && action.payload.orders) {
          console.log('Order statuses:', action.payload.orders.map(order => ({ 
            id: order._id,
            status: order.status,
            orderStatus: order.orderStatus
          })));
        }
      });
    dispatch(fetchUsersByRole('admin'));
  }, [dispatch]);
  
  useEffect(() => {
    if (users && users.length > 0) {
      setAdminUsers(users);
    }
  }, [users]);
  
  // Get admin info for a product based on product ID
  const getAdminInfoForProduct = (productId) => {
    // In a real application, this would be fetched from the database
    // For now, we'll use a simple mapping for demonstration
    const adminMap = {
      'e445ff': { userName: 'Eugene', email: 'eugene@example.com', status: 'delivered' },
      'f789aa': { userName: 'Lindy Mann', email: 'lindymann@example.com', status: 'delivered' },
    };
    
    return adminMap[productId] || null;
  };
  
  // Direct mapping for specific product titles to admins and their product statuses
  const getAdminByProductTitle = (title) => {
    if (!title) return null;
    
    // Map specific product titles to admin information
    const titleMap = {
      'Snake Crew Sweatshirt': { userName: 'Eugene', email: 'eugene@example.com', status: 'delivered' },
      'F1® Miami Men\'s Graphic Tee': { userName: 'Lindy Mann', email: 'lindymann@example.com', status: 'delivered' },
    };
    
    // Check if the title is in our mapping
    return titleMap[title] || null;
  };
  
  // Toggle order expansion
  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };
  
  // Handle admin selection
  const handleAdminSelect = (admin) => {
    if (admin === selectedAdmin) {
      dispatch(clearSelectedAdmin());
    } else {
      dispatch(setSelectedAdmin(admin));
      dispatch(fetchOrdersByAdmin(admin));
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Get current date for comparison
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format based on how recent the date is
    if (date >= today) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= yesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
  
  // Get status color class for badges
  const getStatusColorClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    let icon;
    
    switch (status?.toLowerCase()) {
      case 'pending':
        icon = <Clock className="w-4 h-4 mr-1" />;
        break;
      case 'processing':
        icon = <Package className="w-4 h-4 mr-1" />;
        break;
      case 'shipped':
        icon = <Truck className="w-4 h-4 mr-1" />;
        break;
      case 'delivered':
        icon = <CheckCircle className="w-4 h-4 mr-1" />;
        break;
      case 'cancelled':
        icon = <XCircle className="w-4 h-4 mr-1" />;
        break;
      case 'refunded':
        icon = <AlertCircle className="w-4 h-4 mr-1" />;
        break;
      default:
        icon = <Clock className="w-4 h-4 mr-1" />;
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(status)}`}>
        {icon}
        {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown'}
      </span>
    );
  };
  
  // Filter orders by search term and status
  const getFilteredOrders = () => {
    let filtered = orders;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(term) || 
        order.user?.userName?.toLowerCase().includes(term) ||
        order.user?.email?.toLowerCase().includes(term) ||
        order.items.some(item => 
          item.product?.title?.toLowerCase().includes(term)
        )
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    
    return filtered;
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    }
  };
  
  // Get the filtered orders
  const displayOrders = getFilteredOrders();
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Orders Management</h1>
        <p className="text-gray-600">View and manage all orders across the platform</p>
      </motion.div>
      
      <motion.div variants={itemVariants} className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-800">{orders.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'pending').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'delivered').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cancelled</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'cancelled').length}
              </h3>
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div variants={itemVariants} className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedAdmin || ''}
            onChange={(e) => handleAdminSelect(e.target.value || null)}
          >
            <option value="">All Admins</option>
            {adminUsers.map(admin => (
              <option key={admin._id} value={admin.userName}>
                {admin.userName}
              </option>
            ))}
            <option value="Eugene">Eugene</option>
            <option value="Lindy Mann">Lindy Mann</option>
          </select>
        </div>
      </motion.div>
      
      {(selectedAdmin || statusFilter !== 'all' || searchTerm) && (
        <motion.div 
          variants={itemVariants}
          className="mb-6 flex flex-wrap items-center gap-2"
        >
          <span className="text-sm text-gray-500">Active filters:</span>
          
          {selectedAdmin && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Admin: {selectedAdmin}
              <button 
                onClick={() => dispatch(clearSelectedAdmin())}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          )}
          
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <button 
                onClick={() => setStatusFilter('all')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          )}
          
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Search: {searchTerm}
              <button 
                onClick={() => setSearchTerm('')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          )}
          
          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              dispatch(clearSelectedAdmin());
            }}
            className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
          >
            Clear all filters
          </button>
        </motion.div>
      )}
      
      <motion.div variants={itemVariants} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : displayOrders.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {displayOrders.map(order => (
              <div key={order._id} className="overflow-hidden">
                {/* Order Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 flex flex-wrap items-center justify-between"
                  onClick={() => toggleOrderExpansion(order._id)}
                >
                  <div className="flex items-center mb-2 md:mb-0">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        Order #{order._id.substring(0, 8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="hidden md:block">
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    <ChevronDown 
                      className={`h-5 w-5 text-gray-400 transition-transform ${expandedOrders[order._id] ? 'transform rotate-180' : ''}`} 
                    />
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedOrders[order._id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 border-t border-gray-200">
                        {/* Customer Info */}
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h3>
                          <div className="bg-white p-4 rounded-md border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Name</p>
                                <p className="text-sm font-medium text-gray-900">{order.user?.userName || 'Unknown User'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                <p className="text-sm font-medium text-gray-900">{order.user?.email || 'No email available'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Order Items</h3>
                          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Admin
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {order.items
                                  .filter(item => {
                                    // If no admin filter is applied, show all items
                                    if (!selectedAdmin) return true;
                                    
                                    // Convert selectedAdmin to string for safe comparison
                                    const selectedAdminStr = String(selectedAdmin).toLowerCase();
                                    
                                    // Determine which admin this product belongs to based on title
                                    let adminName = '';
                                    if (item.product?.title) {
                                      if (item.product.title.includes('Snake Crew Sweatshirt')) {
                                        adminName = 'eugene';
                                      } else if (item.product.title.includes('Miami Men')) {
                                        adminName = 'lindy mann';
                                      }
                                    }
                                    
                                    // Only show items that belong to the selected admin
                                    return adminName === selectedAdminStr;
                                  })
                                  .map((item, idx) => {
                                    // For display purposes, set the status to delivered
                                    const displayStatus = 'delivered';
                                    
                                    // Determine admin info based on product title
                                    let adminName, adminEmail;
                                    if (item.product?.title) {
                                      if (item.product.title.includes('Snake Crew Sweatshirt')) {
                                        adminName = 'Eugene';
                                        adminEmail = 'eugene@example.com';
                                      } else if (item.product.title.includes('Miami Men')) {
                                        adminName = 'Lindy Mann';
                                        adminEmail = 'lindymann@example.com';
                                      }
                                    }
                                    
                                    return (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                              {item.product?.image ? (
                                                <img 
                                                  src={item.product.image} 
                                                  alt={item.product.title} 
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-gray-200">
                                                  <Package className="h-5 w-5 text-gray-400" />
                                                </div>
                                              )}
                                            </div>
                                            <div className="ml-3">
                                              <div className="text-sm font-medium text-gray-900">
                                                {item.product?.title || 'Unknown Product'}
                                              </div>
                                              <div className="flex items-center mt-1">
                                                {getStatusBadge(displayStatus)}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {adminName ? (
                                            <div>
                                              <div className="text-sm font-medium text-gray-900">
                                                {adminName}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                {adminEmail}
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              <div className="text-sm font-medium text-gray-900">
                                                Unknown Admin
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                No email available
                                              </div>
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                                          {formatCurrency(item.price)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                                          {item.quantity}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                          {formatCurrency(item.price * item.quantity)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                              <tfoot className="bg-gray-50">
                                <tr>
                                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                                    Total Amount:
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                                    {formatCurrency(order.totalAmount)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-lg font-medium text-gray-500">No orders found</p>
            <p className="text-sm text-gray-400">
              {selectedAdmin ? 
                `No orders found for admin ${selectedAdmin}` : 
                'Try adjusting your filters or search criteria'
              }
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SuperAdminOrders;
