import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchAllOrders, fetchOrderStats } from '../../store/super-admin/orders-slice';
import { fetchProductStats } from '../../store/super-admin/products-slice';
import { fetchAllUsers, fetchUsersByRole } from '../../store/super-admin/user-slice';
import { fetchAdminRevenueByTime } from '../../store/super-admin/revenue-slice';
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
  const { isLoading: revenueLoading, error: revenueError } = useSelector(state => state.superAdminRevenue);
  
  const [adminUsers, setAdminUsers] = useState([]);
  
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
        dispatch(fetchUsersByRole('admin'))
      ]);

      // Third batch: Revenue data (can load in background)
      await Promise.all([
        dispatch(fetchAdminRevenueByTime('daily')),
        dispatch(fetchAdminRevenueByTime('weekly')),
        dispatch(fetchAdminRevenueByTime('monthly')),
        dispatch(fetchAdminRevenueByTime('yearly'))
      ]);

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
  
  // Format currency
  const formatCurrency = (amount) => {
    return `GH₵${parseFloat(amount || 0).toFixed(2)}`;
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

  // Separate core content loading from additional data loading
  const coreDataLoading = ordersLoading || productsLoading;
  const userDataLoading = usersLoading;
  const revenueDataLoading = revenueLoading;
  const isLoading = coreDataLoading;
  const error = ordersError || productsError || usersError || revenueError;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Super Admin Dashboard</h1>
        <p className="text-gray-600">Overview of all store statistics and admin performance</p>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center"
        >
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Total Revenue */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium">Gross Revenue</h3>
                <span className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(orderStats?.totalRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total revenue before fees</p>
            </div>

            {/* Shipping Fees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium">Shipping Fees</h3>
                <span className="p-2 bg-blue-100 rounded-full">
                  <TruckIcon className="h-5 w-5 text-blue-600" />
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(orderStats?.totalShippingFees || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total shipping charges</p>
            </div>
            
            {/* Platform Fees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium">Platform Fees</h3>
                <span className="p-2 bg-red-100 rounded-full">
                  <Percent className="h-5 w-5 text-red-600" />
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(orderStats?.platformFees || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">5% of gross revenue</p>
            </div>
            
            {/* Net Revenue */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium">Net Revenue</h3>
                <span className="p-2 bg-blue-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(orderStats?.netRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">After platform fees</p>
            </div>
            
            {/* Total Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium">Total Orders</h3>
                <span className="p-2 bg-blue-100 rounded-full">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {orderStats?.totalOrders || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Processed orders</p>
            </div>
            
            {/* Total Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium">Total Products</h3>
                <span className="p-2 bg-purple-100 rounded-full">
                  <Package className="h-5 w-5 text-purple-600" />
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {productStats?.totalProducts || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">In inventory</p>
            </div>
            
            {/* Active Admins */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium">Active Admins</h3>
                <span className="p-2 bg-orange-100 rounded-full">
                  <Users className="h-5 w-5 text-orange-600" />
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {adminUsers.length || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Active administrators</p>
            </div>
          </motion.div>

          {/* Admin Revenue Analytics Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Revenue Analytics</h2>
            {revenueDataLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-4 h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-500">Loading revenue data...</span>
              </div>
            ) : (
              <AdminRevenueAnalytics />
            )}
          </motion.div>
          
          {/* Order Status Section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Order Status</h2>
              <div className="ml-2 h-1 w-10 bg-blue-500 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Pending Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium">Pending</h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    New
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.pending || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">New orders awaiting processing</p>
              </div>
              
              {/* Processing Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium">Processing</h3>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                    In Progress
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.processing || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Orders being processed</p>
              </div>
              
              {/* Confirmed Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium">Confirmed</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    Verified
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.confirmed || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Orders confirmed and ready to ship</p>
              </div>
              
              {/* Shipped Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium">Shipped</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    In Transit
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.shipped || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Orders in transit</p>
              </div>
              
              {/* Delivered Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium">Delivered</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Completed
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.delivered || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Completed orders</p>
              </div>
              
              {/* Cancelled Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-500 font-medium">Cancelled</h3>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    Rejected
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.ordersByStatus?.cancelled || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Cancelled orders</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default SuperAdminDashboard;
