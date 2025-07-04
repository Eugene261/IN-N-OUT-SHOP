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
    dispatch(fetchUsersByRole({ role: 'admin' }));
  }, [dispatch]);
  
  useEffect(() => {
    if (users && users.length > 0) {
      setAdminUsers(users);
    }
  }, [users]);
  
  // Get admin information for a product (using real database data only)
  const getAdminInfoForProduct = (productId) => {
    // Only use real admin data from products populated with createdBy field
    // No hardcoded mappings
    return null;
  };
  
  // Get admin by product title (using real database data only)
  const getAdminByProductTitle = (title) => {
    // Only use real admin data from products populated with createdBy field
    // No hardcoded mappings based on product titles
    return null;
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
  
  // Format currency - use GHS currency as in the admin dashboard
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    const numPrice = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numPrice)) return 'N/A';
    return `GHS ${numPrice.toFixed(2)}`;
  };
  
  // Calculate shipping fee - use real backend data
  const calculateShippingFee = (order) => {
    // Use the shipping fee calculated by the backend
    if (order && order.shippingFee !== undefined) {
      return parseFloat(order.shippingFee) || 0;
    }
    
    // Fallback: if no backend shipping fee, return 0
    return 0;
  };
  
  // Calculate subtotal (without shipping fee)
  const calculateSubtotal = (order) => {
    if (!order || !order.items || !order.items.length) return 0;
    
    return order.items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
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
        icon = <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
        break;
      case 'processing':
        icon = <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
        break;
      case 'shipped':
        icon = <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
        break;
      case 'delivered':
        icon = <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
        break;
      case 'cancelled':
        icon = <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
        break;
      case 'refunded':
        icon = <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
        break;
      default:
        icon = <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(status)}`}>
        {icon}
        <span className="hidden sm:inline">
          {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown'}
        </span>
        <span className="sm:hidden">
          {status ? status.charAt(0).toUpperCase() + status.charAt(1).toLowerCase() : 'Un'}
        </span>
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
      className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl"
    >
      <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Orders Management</h1>
        <p className="text-sm sm:text-base text-gray-600">View and manage all orders across the platform</p>
      </motion.div>
      
      {/* Stats Cards - Mobile optimized */}
      <motion.div variants={itemVariants} className="mb-6 sm:mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full mr-2 sm:mr-4">
              <Package className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Total Orders</p>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800">{orders.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 shadow-sm">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-full mr-2 sm:mr-4">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Pending</p>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'pending').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 shadow-sm">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 sm:p-3 rounded-full mr-2 sm:mr-4">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Delivered</p>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'delivered').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 shadow-sm">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 sm:p-3 rounded-full mr-2 sm:mr-4">
              <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Cancelled</p>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                {orders.filter(order => order.status === 'cancelled').length}
              </h3>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Filters - Mobile optimized */}
      <motion.div variants={itemVariants} className="mb-6 sm:mb-8 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={selectedAdmin || ''}
            onChange={(e) => handleAdminSelect(e.target.value || null)}
          >
            <option value="">All Admins</option>
            
            {/* Only show real admin users from database */}
            {adminUsers && adminUsers.length > 0 && adminUsers.map(admin => (
              <option key={admin._id} value={admin.userName}>
                {admin.userName}
              </option>
            ))}
          </select>
        </div>
      </motion.div>
      
      {/* Active Filters */}
      {(selectedAdmin || statusFilter !== 'all' || searchTerm) && (
        <motion.div 
          variants={itemVariants}
          className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2"
        >
          <span className="text-xs sm:text-sm text-gray-500">Active filters:</span>
          
          {selectedAdmin && (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-800">
              Admin: <span className="truncate max-w-20 sm:max-w-none">{selectedAdmin}</span>
              <button 
                onClick={() => dispatch(clearSelectedAdmin())}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </span>
          )}
          
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-800">
              Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <button 
                onClick={() => setStatusFilter('all')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </span>
          )}
          
          {searchTerm && (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-800">
              Search: <span className="truncate max-w-16 sm:max-w-none">{searchTerm}</span>
              <button 
                onClick={() => setSearchTerm('')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </span>
          )}
          
          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              dispatch(clearSelectedAdmin());
            }}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 ml-auto"
          >
            Clear all filters
          </button>
        </motion.div>
      )}
      
      <motion.div variants={itemVariants} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-sm sm:text-base text-gray-600">Loading orders...</p>
          </div>
        ) : displayOrders.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {displayOrders.map(order => (
              <div key={order._id} className="overflow-hidden">
                {/* Order Header - Mobile optimized */}
                <div 
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleOrderExpansion(order._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start min-w-0 flex-1">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          Order #{order._id.substring(0, 8)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="mt-2 sm:hidden">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-4">
                      <div className="text-right mr-3 sm:mr-4">
                        <div className="hidden sm:block mb-2">
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                      <ChevronDown 
                        className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform ${expandedOrders[order._id] ? 'transform rotate-180' : ''}`} 
                      />
                    </div>
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
                      <div className="p-4 sm:p-6 border-t border-gray-200">
                        {/* Customer Info */}
                        <div className="mb-4 sm:mb-6">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h3>
                          <div className="bg-white p-3 sm:p-4 rounded-md border border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Name</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{order.user?.userName || 'Unknown User'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{order.user?.email || 'No email available'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Order Items - Mobile optimized */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Order Items</h3>
                          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                            {/* Desktop Table View */}
                            <div className="hidden sm:block">
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
                                      
                                      // Only filter by real admin data from product's createdBy field
                                      if (item.product?.createdBy?.userName) {
                                        return item.product.createdBy.userName === selectedAdmin;
                                      }
                                      
                                      // If no createdBy data, don't show for specific admin filter
                                      return false;
                                    })
                                    .map((item, idx) => {
                                      // Get real admin info from product's createdBy field
                                      const adminName = item.product?.createdBy?.userName || 'Unknown Admin';
                                      const adminEmail = item.product?.createdBy?.email || 'No email available';
                                      const displayStatus = order.status || 'processing';
                                      
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
                                            <div>
                                              <div className="text-sm font-medium text-gray-900">
                                                {adminName}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                {adminEmail}
                                              </div>
                                            </div>
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
                              </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden divide-y divide-gray-200">
                              {order.items
                                .filter(item => {
                                  // If no admin filter is applied, show all items
                                  if (!selectedAdmin) return true;
                                  
                                  // Only filter by real admin data from product's createdBy field
                                  if (item.product?.createdBy?.userName) {
                                    return item.product.createdBy.userName === selectedAdmin;
                                  }
                                  
                                  // If no createdBy data, don't show for specific admin filter
                                  return false;
                                })
                                .map((item, idx) => {
                                  // Get real admin info from product's createdBy field
                                  const adminName = item.product?.createdBy?.userName || 'Unknown Admin';
                                  const adminEmail = item.product?.createdBy?.email || 'No email available';
                                  const displayStatus = order.status || 'processing';
                                  
                                  return (
                                    <div key={idx} className="p-4">
                                      <div className="flex items-start space-x-3">
                                        <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                          {item.product?.image ? (
                                            <img 
                                              src={item.product.image} 
                                              alt={item.product.title} 
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-gray-200">
                                              <Package className="h-6 w-6 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-gray-900 truncate mb-1">
                                            {item.product?.title || 'Unknown Product'}
                                          </div>
                                          <div className="mb-2">
                                            {getStatusBadge(displayStatus)}
                                          </div>
                                          <div className="text-xs text-gray-500 mb-2">
                                            <div className="truncate">Admin: {adminName}</div>
                                            <div className="truncate">{adminEmail}</div>
                                          </div>
                                          <div className="flex justify-between items-center text-sm">
                                            <div>
                                              <span className="text-gray-500">Qty:</span> {item.quantity}
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Price:</span> {formatCurrency(item.price)}
                                            </div>
                                            <div className="font-medium">
                                              {formatCurrency(item.price * item.quantity)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Items Subtotal:</span>
                                <span className="text-gray-900">{formatCurrency(calculateSubtotal(order))}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 flex items-center">
                                  <Truck className="h-4 w-4 mr-1 text-gray-400" /> Shipping:
                                </span>
                                <span className="text-gray-900">{formatCurrency(calculateShippingFee(order))}</span>
                              </div>
                              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
                                <span className="text-gray-900">Total Amount:</span>
                                <span className="text-gray-900">{formatCurrency(order.totalAmount)}</span>
                              </div>
                            </div>
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
            <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-2" />
            <p className="text-base sm:text-lg font-medium text-gray-500">No orders found</p>
            <p className="text-sm text-gray-400 text-center px-4">
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
