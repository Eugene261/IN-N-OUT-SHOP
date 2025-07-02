import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenueStats, fetchAdminOrders, updateOrderStatus } from '@/store/admin/revenue-slice';
import { DollarSign, Package, ShoppingBag, TruckIcon, CreditCard, BarChart3, X, ArrowRight, Percent } from 'lucide-react';
import AdminRevenueStats from './adminRevenueStats';

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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] 
    }
  }
};

function RevenueDashboard() {
  const dispatch = useDispatch();
  const { revenueStats, adminOrders, isLoading, error } = useSelector(state => state.adminRevenue);
  
  // Debug current data structure
  console.log('Current revenue stats in component:', revenueStats);
  const { user } = useSelector(state => state.auth);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  
  // Order details dialog states
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState('');

  useEffect(() => {
    // Fetch revenue stats and explicitly debug the shipping fee issue
    dispatch(fetchRevenueStats())
      .then((action) => {
        // Log the complete response data to debug structure
        console.log('Revenue stats response:', action.payload);
        
        // Focus on shipping fee debugging
        if (action.payload?.data) {
          console.log('Shipping fee from API:', action.payload.data.totalShippingFees);
          console.log('Shipping fee type:', typeof action.payload.data.totalShippingFees);
          
          // Check if the value is being properly assigned to the state
          setTimeout(() => {
            console.log('Current shipping fee in component state:', revenueStats?.totalShippingFees);
          }, 500);
        }
      });
    dispatch(fetchAdminOrders());
  }, [dispatch]);
  
  // Function to open dialog with specific content
  const openCardDialog = (type) => {
    console.log('Opening dialog:', type);
    setDialogType(type);
    
    switch(type) {
      case 'revenue':
        setDialogTitle('Revenue Details');
        setDialogDescription('Breakdown of your total earnings');
        break;
      case 'shipping':
        setDialogTitle('Shipping Fees');
        setDialogDescription('Breakdown of shipping fees collected');
        break;
      case 'items':
        setDialogTitle('Items Sold');
        setDialogDescription('Details of products sold');
        break;
      case 'orders':
        setDialogTitle('Order History');
        setDialogDescription('All orders containing your products');
        break;
      case 'pending':
        setDialogTitle('Pending Deliveries');
        setDialogDescription('Orders that need to be delivered');
        break;
      case 'payments':
        setDialogTitle('Confirmed Payments');
        setDialogDescription('Orders with confirmed payments');
        break;
      case 'products':
        setDialogTitle('Your Products');
        setDialogDescription('All products in your inventory');
        break;
      case 'fees':
        setDialogTitle('Platform Fees');
        setDialogDescription('Details of platform fees');
        break;
      case 'net':
        setDialogTitle('Net Revenue');
        setDialogDescription('Earnings after platform fees');
        break;
      default:
        setDialogTitle('Details');
        setDialogDescription('');
    }
    
    setOpenDialog(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `GH₵${parseFloat(amount || 0).toFixed(2)}`;
  };
  
  // Calculate total shipping fees (only use server-provided values, no hardcoded fallbacks)
  const calculateTotalShippingFees = () => {
    // Only use the real totalShippingFees from the backend
    // DO NOT use any hardcoded fallbacks or calculated values
    return revenueStats?.totalShippingFees || 0;
  };
  
  // Get the shipping fee value for display
  const getShippingFeeDisplayValue = () => {
    return formatCurrency(calculateTotalShippingFees());
  };
  
  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'No date available';
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'No date available';
      }
      
      // Format the date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'No date available';
    }
  };

  // Custom Modal Component - Inline version without dark background
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    
    return (
      <div className="mt-8 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-full overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };
  
  // Render dialog content based on type
  const renderDialogContent = () => {
    switch(dialogType) {
      case 'revenue':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800">Total Revenue</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(revenueStats?.totalRevenue)}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Revenue Breakdown</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Gross Revenue:</span>
                  <span className="font-medium">{formatCurrency(revenueStats?.totalRevenue || 0)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Shipping Fees:</span>
                  <span className="font-medium">
                    {formatCurrency(revenueStats?.totalShippingFees || 0)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Platform Fees:</span>
                  <span className="font-medium">
                    {formatCurrency(revenueStats?.totalPlatformFees || 0)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Net Revenue:</span>
                  <span className="font-medium">
                    {formatCurrency(revenueStats?.netRevenue || 0)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="font-medium">{revenueStats?.totalOrders || 0}</span>
                </li>
              </ul>
            </div>
          </div>
        );
      case 'shipping':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Total Shipping Fees</h4>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(revenueStats?.totalShippingFees || 0)}
              </p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Shipping Fee Breakdown</h4>
              <ul className="space-y-2">
                {/* Dynamically generate shipping fee breakdown by region */}
                {revenueStats?.shippingFeesByRegion && Object.entries(revenueStats.shippingFeesByRegion)
                  .filter(([key]) => key !== 'total') // Skip total if present
                  .map(([region, data]) => {
                    // Handle both legacy number values and new object structure
                    const count = typeof data === 'object' ? (data.count || 0) : (data || 0);
                    const avgFee = typeof data === 'object' && data.averageFee ? 
                      ` (Avg: ${formatCurrency(data.averageFee)})` : '';
                    
                    return (
                      <li key={region} className="flex justify-between">
                        <span className="text-gray-600">{region.charAt(0).toUpperCase() + region.slice(1)}{avgFee}:</span>
                        <span className="font-medium">{count} orders</span>
                      </li>
                    );
                  })
                }
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Shipping Fee:</span>
                  <span className="font-medium">
                    {revenueStats?.totalOrders ? formatCurrency((revenueStats?.totalShippingFees || 0) / (revenueStats?.totalOrders || 1)) : 'N/A'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        );
      case 'items':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Total Items Sold</h4>
              <p className="text-2xl font-bold text-blue-900">{revenueStats?.totalItemsSold || 0}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Items Breakdown</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Products:</span>
                  <span className="font-medium">{revenueStats?.adminProducts || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Items Per Order:</span>
                  <span className="font-medium">
                    {(revenueStats?.totalItemsSold / (revenueStats?.totalOrders || 1)).toFixed(2)}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800">Total Orders</h4>
              <p className="text-2xl font-bold text-purple-900">{revenueStats?.totalOrders || 0}</p>
            </div>
            <div className="border-t pt-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-2">Recent Orders</h4>
              {adminOrders && adminOrders.length > 0 ? (
                <ul className="space-y-3">
                  {adminOrders.slice(0, 5).map(order => (
                    <li key={order._id} className="border p-3 rounded-md">
                      <div className="flex justify-between">
                        <span className="font-medium">Order #{order._id.substring(order._id.length - 6)}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(order.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No orders found</p>
              )}
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800">Pending Deliveries</h4>
              <p className="text-2xl font-bold text-yellow-900">{revenueStats?.pendingDeliveries || 0}</p>
            </div>
            <div className="border-t pt-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-2">Orders Awaiting Delivery</h4>
              {adminOrders && adminOrders.length > 0 ? (
                <ul className="space-y-3">
                  {adminOrders
                    .filter(order => {
                      // Normalize status to lowercase for consistent comparison
                      const orderStatus = order.orderStatus ? order.orderStatus.toLowerCase() : '';
                      const paymentStatus = order.paymentStatus ? order.paymentStatus.toLowerCase() : '';
                      
                      // Only include confirmed, processing, and shipped orders that are paid
                      return ['confirmed', 'processing', 'shipped'].includes(orderStatus) && 
                             paymentStatus === 'paid';
                    })
                    .map(order => (
                      <li key={order._id} className="border p-3 rounded-md">
                        <div className="flex justify-between">
                          <span className="font-medium">Order #{order._id.substring(order._id.length - 6)}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.orderStatus === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                            order.orderStatus === 'processing' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(order.createdAt)}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setUpdatedStatus(order.orderStatus);
                            setOpenDialog(false);
                            setOpenOrderDialog(true);
                          }}
                          className="mt-2 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                        >
                          Update Status
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-500">No pending deliveries</p>
              )}
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium text-indigo-800">Confirmed Payments</h4>
              <p className="text-2xl font-bold text-indigo-900">{revenueStats?.confirmedPayments || 0}</p>
            </div>
            <div className="border-t pt-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-2">Paid Orders</h4>
              {adminOrders && adminOrders.length > 0 ? (
                <ul className="space-y-3">
                  {adminOrders
                    .filter(order => order.paymentStatus === 'paid')
                    .map(order => (
                      <li key={order._id} className="border p-3 rounded-md">
                        <div className="flex justify-between">
                          <span className="font-medium">Order #{order._id.substring(order._id.length - 6)}</span>
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            Paid
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(order.createdAt)}
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-500">No confirmed payments</p>
              )}
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="space-y-4">
            <div className="bg-pink-50 p-4 rounded-lg">
              <h4 className="font-medium text-pink-800">Your Products</h4>
              <p className="text-2xl font-bold text-pink-900">{revenueStats?.adminProducts || 0}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Product Statistics</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Sales per Product:</span>
                  <span className="font-medium">
                    {(revenueStats?.totalItemsSold / (revenueStats?.adminProducts || 1)).toFixed(2)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Revenue per Product:</span>
                  <span className="font-medium">
                    {formatCurrency(revenueStats?.totalRevenue / (revenueStats?.adminProducts || 1))}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        );
      case 'fees':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800">Platform Fees</h4>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(revenueStats?.totalPlatformFees || 0)}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Fees Breakdown</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Platform Fees:</span>
                  <span className="font-medium">5% of gross revenue</span>
                </li>
              </ul>
            </div>
          </div>
        );
      case 'net':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Net Revenue</h4>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(revenueStats?.netRevenue || 0)}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Revenue Breakdown</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-medium">{formatCurrency(revenueStats?.totalRevenue)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Platform Fees:</span>
                  <span className="font-medium">{formatCurrency(revenueStats?.totalPlatformFees || 0)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Net Revenue:</span>
                  <span className="font-medium">{formatCurrency(revenueStats?.netRevenue || 0)}</span>
                </li>
              </ul>
            </div>
          </div>
        );
      default:
        return <p>No data available</p>;
    }
  };

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Revenue Dashboard</h2>
        <p className="text-sm sm:text-base text-gray-500">Sales performance for {user?.name || 'admin'}</p>
      </div>

      {/* Modal/Dialog Content */}
      <Modal isOpen={openDialog} onClose={() => setOpenDialog(false)} title={dialogTitle}>
        {renderDialogContent()}
      </Modal>

      {/* Stats Grid - Mobile Optimized */}
      <motion.div
        variants={cardVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
      >
        {/* Total Revenue Card */}
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => openCardDialog('revenue')}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Revenue</h3>
            <span className="p-1.5 sm:p-2 bg-green-100 rounded-full">
              <DollarSign className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(revenueStats?.totalRevenue || 0)}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">Click for details</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          </div>
        </div>

        {/* Shipping Fees Card */}
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => openCardDialog('shipping')}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Shipping Fees</h3>
            <span className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
              <TruckIcon className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {getShippingFeeDisplayValue()}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">Click for breakdown</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          </div>
        </div>

        {/* Items Sold Card */}
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => openCardDialog('items')}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Items Sold</h3>
            <span className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
              <Package className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {revenueStats?.totalItemsSold || 0}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">View breakdown</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          </div>
        </div>

        {/* Total Orders Card */}
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => openCardDialog('orders')}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Orders</h3>
            <span className="p-1.5 sm:p-2 bg-purple-100 rounded-full">
              <ShoppingBag className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {revenueStats?.totalOrders || 0}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">View all orders</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          </div>
        </div>
      </motion.div>

      {/* Secondary Stats Grid - Mobile Optimized */}
      <motion.div
        variants={cardVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
      >
        {/* Pending Deliveries Card */}
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => openCardDialog('pending')}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Pending Deliveries</h3>
            <span className="p-1.5 sm:p-2 bg-yellow-100 rounded-full">
              <TruckIcon className="h-3 w-3 sm:h-5 sm:w-5 text-yellow-600" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {revenueStats?.pendingDeliveries || 0}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">Manage deliveries</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          </div>
        </div>

        {/* Confirmed Payments Card */}
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => openCardDialog('payments')}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Confirmed Payments</h3>
            <span className="p-1.5 sm:p-2 bg-indigo-100 rounded-full">
              <CreditCard className="h-3 w-3 sm:h-5 sm:w-5 text-indigo-600" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {revenueStats?.confirmedPayments || 0}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">View payments</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          </div>
        </div>

        {/* Products Card */}
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => openCardDialog('products')}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Your Products</h3>
            <span className="p-1.5 sm:p-2 bg-pink-100 rounded-full">
              <Package className="h-3 w-3 sm:h-5 sm:w-5 text-pink-600" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {revenueStats?.adminProducts || 0}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">Manage products</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          </div>
        </div>

        {/* Net Revenue Card - Full width on mobile */}
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer sm:col-span-2 lg:col-span-1"
          onClick={() => openCardDialog('net')}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Net Revenue</h3>
            <span className="p-1.5 sm:p-2 bg-green-100 rounded-full">
              <DollarSign className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(revenueStats?.netRevenue || 0)}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">After platform fees</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          </div>
        </div>
      </motion.div>

      {/* Revenue Analytics Component */}
      <motion.div variants={cardVariants}>
        <AdminRevenueStats />
      </motion.div>

      {/* Order Status Update Modal */}
      <Modal
        isOpen={openOrderDialog}
        onClose={() => setOpenOrderDialog(false)}
        title="Update Order Status"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium">Order #{selectedOrder._id.substring(selectedOrder._id.length - 6)}</h4>
              <p className="text-sm text-gray-500 mt-1">
                Created on {formatDate(selectedOrder.createdAt)}
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Select New Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {['processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => setUpdatedStatus(status)}
                    className={`px-3 py-2 rounded-md text-sm capitalize ${updatedStatus === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                onClick={() => setOpenOrderDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  dispatch(updateOrderStatus({
                    orderId: selectedOrder._id,
                    status: updatedStatus
                  }));
                  setOpenOrderDialog(false);
                  // Refresh data after a short delay
                  setTimeout(() => {
                    dispatch(fetchRevenueStats());
                    dispatch(fetchAdminOrders());
                  }, 1000);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Update Status
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

export default RevenueDashboard;
