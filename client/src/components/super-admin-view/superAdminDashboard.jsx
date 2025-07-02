import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchAllOrders, fetchOrderStats } from '../../store/super-admin/orders-slice';
import { fetchProductStats } from '../../store/super-admin/products-slice';
import { fetchAllUsers, fetchUsersByRole } from '../../store/super-admin/user-slice';
// Revenue data fetching is handled by AdminRevenueAnalytics component
import AdminRevenueAnalytics from './adminRevenueAnalytics';
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Package, 
  BarChart3, 
  TrendingUp, 
  Loader2, 
  AlertCircle,
  Percent,
  TruckIcon
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const { orderStats, isLoading: ordersLoading, error: ordersError } = useSelector(state => state.superAdminOrders);
  const { productStats, isLoading: productsLoading, error: productsError } = useSelector(state => state.superAdminProducts);
  const { users, isLoading: usersLoading, error: usersError } = useSelector(state => state.superAdminUsers);
  // Revenue loading state is managed by AdminRevenueAnalytics component itself
  
  const [adminUsers, setAdminUsers] = useState([]);
  
  // Simplified loading logic - only show loading if we don't have any data yet
  const [hasInitialData, setHasInitialData] = useState(false);
  
  useEffect(() => {
    // Consider we have initial data if we have either order stats or product stats
    if (orderStats || productStats) {
      setHasInitialData(true);
    }
  }, [orderStats, productStats]);
  
  // Only show loading if we don't have any data and something is actually loading
  const isLoading = !hasInitialData && (ordersLoading || productsLoading);
  const error = ordersError || productsError || usersError;
  
  // Function to fetch data progressively
  const fetchDashboardData = useCallback(async () => {
    try {
      // First batch: Critical stats
      await Promise.all([
        dispatch(fetchOrderStats()),
        dispatch(fetchProductStats())
      ]);

      // Second batch: User data
      await Promise.all([
        dispatch(fetchAllUsers()),
        dispatch(fetchUsersByRole({ role: 'admin' }))
      ]);

      // Revenue data will be fetched by AdminRevenueAnalytics component itself
      // No need to fetch it here to avoid conflicts

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [dispatch]);
  
  // Initial data fetch on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Update adminUsers when users data changes
  useEffect(() => {
    if (users && users.length > 0) {
      setAdminUsers(users.filter(user => user.role === 'admin'));
    }
  }, [users]);
  
  // Debug logging for data
  useEffect(() => {
    console.log('Dashboard loading states:', {
      ordersLoading,
      productsLoading,
      usersLoading,
      hasInitialData,
      isLoading,
      hasOrderStats: !!orderStats,
      hasProductStats: !!productStats,
      adminUsersCount: adminUsers.length,
      error
    });
    
    if (orderStats) {
      console.log('Order stats received:', {
        totalRevenue: orderStats.totalRevenue,
        totalShippingFees: orderStats.totalShippingFees,
        platformFees: orderStats.platformFees,
        netRevenue: orderStats.netRevenue,
        totalOrders: orderStats.totalOrders
      });
    }
    
    if (productStats) {
      console.log('Product stats received:', {
        totalProducts: productStats.totalProducts
      });
    }
    
    if (error) {
      console.error('Dashboard error:', error);
    }
  }, [ordersLoading, productsLoading, usersLoading, hasInitialData, isLoading, orderStats, productStats, adminUsers, error]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return `GHS ${parseFloat(amount || 0).toFixed(2)}`;
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
      className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Super Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Overview of all store statistics and admin performance</p>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-200 rounded-lg flex items-center"
        >
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 sm:mr-3 flex-shrink-0" />
          <span className="text-red-700 text-sm sm:text-base">{error}</span>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Loading dashboard data...</p>
          <div className="mt-4 text-xs sm:text-sm text-gray-500 text-center">
            <p>Orders Loading: {ordersLoading ? 'Yes' : 'No'}</p>
            <p>Products Loading: {productsLoading ? 'Yes' : 'No'}</p>
            <p>Users Loading: {usersLoading ? 'Yes' : 'No'}</p>
          </div>
          <button 
            onClick={() => setHasInitialData(true)}
            className="mt-4 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm"
          >
            Force Show Content (Debug)
          </button>
        </div>
      ) : (
        <>
          {/* Overview Stats - Mobile Optimized Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
          >
            {/* Total Revenue */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Gross Revenue</h3>
                <span className="p-1.5 sm:p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(orderStats?.totalRevenue || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Total revenue before fees</p>
            </div>

            {/* Shipping Fees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Shipping Fees</h3>
                <span className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                  <TruckIcon className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(orderStats?.totalShippingFees || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Total shipping charges</p>
            </div>
            
            {/* Platform Fees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Platform Fees</h3>
                <span className="p-1.5 sm:p-2 bg-red-100 rounded-full">
                  <Percent className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(orderStats?.platformFees || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">5% of gross revenue</p>
            </div>
            
            {/* Net Revenue */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Net Revenue</h3>
                <span className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                  <DollarSign className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(orderStats?.netRevenue || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">After platform fees</p>
            </div>
          </motion.div>

          {/* Secondary Stats - Mobile Optimized Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
          >
            {/* Total Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Total Orders</h3>
                <span className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                  <ShoppingBag className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                {orderStats?.totalOrders || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Processed orders</p>
            </div>
            
            {/* Total Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Total Products</h3>
                <span className="p-1.5 sm:p-2 bg-purple-100 rounded-full">
                  <Package className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                {productStats?.totalProducts || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">In inventory</p>
            </div>
            
            {/* Active Admins */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Active Admins</h3>
                <span className="p-1.5 sm:p-2 bg-orange-100 rounded-full">
                  <Users className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                {adminUsers.length || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Active administrators</p>
            </div>
          </motion.div>

          {/* Admin Revenue Analytics Section */}
          <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
            <AdminRevenueAnalytics />
          </motion.div>
          
          {/* Order Status Section - Mobile Optimized */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Order Status</h2>
              <div className="ml-2 h-0.5 sm:h-1 w-8 sm:w-10 bg-blue-500 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {/* Pending Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Pending</h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    New
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.pending || 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">New orders awaiting processing</p>
              </div>
              
              {/* Processing Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Processing</h3>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                    In Progress
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.processing || 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Orders being processed</p>
              </div>
              
              {/* Confirmed Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Confirmed</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    Verified
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.confirmed || 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Orders confirmed and ready to ship</p>
              </div>
              
              {/* Shipped Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Shipped</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    In Transit
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.shipped || 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Orders in transit</p>
              </div>
              
              {/* Delivered Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Delivered</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Completed
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.delivered || 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Completed orders</p>
              </div>
              
              {/* Cancelled Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium text-xs sm:text-sm">Cancelled</h3>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    Rejected
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.cancelled || 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Cancelled orders</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default SuperAdminDashboard;
