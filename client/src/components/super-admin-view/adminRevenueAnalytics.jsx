import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  Filter, 
  RefreshCw,
  Clock,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Loader2,
  TruckIcon,
  Percent
} from 'lucide-react';
import { fetchOrderStats } from '../../store/super-admin/orders-slice';
import { fetchAdminRevenueByTime, fetchTimeout, clearPeriodError } from '../../store/super-admin/revenue-slice';

const AdminRevenueAnalytics = () => {
  const dispatch = useDispatch();
  const { orderStats, isLoading: ordersLoading } = useSelector(state => state.superAdminOrders);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { 
    dailyRevenue, 
    weeklyRevenue, 
    monthlyRevenue, 
    yearlyRevenue, 
    isLoading: revenueLoading,
    loadingStates,
    errors,
    error: revenueError 
  } = useSelector(state => state.superAdminRevenue);
  
  // Use ref to track if we've already fetched data for this user session
  const hasFetchedData = useRef(false);
  
  // State for accordion sections
  const [openSection, setOpenSection] = useState('daily');
  
  // State for filters
  const [selectedAdmin, setSelectedAdmin] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  });
  
  // Format currency with GHS prefix to match admin dashboard
  const formatCurrency = (amount) => {
    return `GHS ${parseFloat(amount || 0).toFixed(2)}`;
  };
  
  // Calculate shipping fees - handles both total view and admin-specific portions
  const calculateShippingFees = (adminData, isAdminSpecific = true) => {
    if (!adminData) return 0;
    
    // SuperAdmin dashboard shows the total shipping fees (all admins)
    // Admin dashboard shows only that admin's portion of shipping fees
    
    // For admin-specific data (individual admin lines in superAdmin dashboard)
    if (isAdminSpecific) {
      // Only use direct shipping fees for this admin if available
      if (adminData.shippingFees !== undefined && adminData.shippingFees !== null) {
        return parseFloat(adminData.shippingFees) || 0;
      }
      
      // NO FALLBACK CALCULATIONS - only real data
      return 0;
    }
    // For total shipping fees (daily/weekly totals in superAdmin dashboard)
    else {
      // If we have direct total shipping fees from the server response
      if (adminData.totalShippingFees !== undefined && adminData.totalShippingFees !== null) {
        return parseFloat(adminData.totalShippingFees) || 0;
      }
      
      // Otherwise sum up all admin shipping fees if available
      if (adminData.adminRevenue && Array.isArray(adminData.adminRevenue)) {
        const totalFromAdmins = adminData.adminRevenue.reduce((total, admin) => {
          return total + calculateShippingFees(admin, true);
        }, 0);
        return totalFromAdmins;
      }
      
      // NO FALLBACK CALCULATIONS - only real data
      return 0;
    }
  };
  
  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Toggle accordion section
  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };
  
  // Debug logging for auth state
  useEffect(() => {
    console.log('AdminRevenueAnalytics: Auth state:', {
      isAuthenticated,
      user: user ? { id: user.id, role: user.role, email: user.email } : null,
      token: localStorage.getItem('token') ? 'exists' : 'missing'
    });
  }, [isAuthenticated, user]);
  
  // Initial data fetch with timeout protection - ONLY RUNS ONCE PER COMPONENT MOUNT
  useEffect(() => {
    console.log('AdminRevenueAnalytics: useEffect triggered', {
      isAuthenticated,
      userRole: user?.role,
      hasFetchedData: hasFetchedData.current
    });
    
    // Only fetch data if:
    // 1. User is authenticated and is superAdmin
    // 2. We haven't already fetched data
    if (isAuthenticated && user && user.role === 'superAdmin' && !hasFetchedData.current) {
      console.log('AdminRevenueAnalytics: Starting data fetch...');
      console.log('AdminRevenueAnalytics: User is authenticated as superAdmin, fetching data...');
      
      // Mark that we've fetched data
      hasFetchedData.current = true;
      
      dispatch(fetchOrderStats());
      dispatch(fetchAdminRevenueByTime('daily'));
      dispatch(fetchAdminRevenueByTime('weekly'));
      dispatch(fetchAdminRevenueByTime('monthly'));
      dispatch(fetchAdminRevenueByTime('yearly'));
      
      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Revenue data fetch timeout triggered');
        dispatch(fetchTimeout());
      }, 10000); // 10 seconds timeout
      
      // Cleanup timeout on unmount
      return () => clearTimeout(timeoutId);
    } else {
      console.log('AdminRevenueAnalytics: Skipping data fetch', {
        isAuthenticated,
        userRole: user?.role,
        hasFetchedData: hasFetchedData.current,
        reason: !isAuthenticated ? 'not authenticated' : 
                !user ? 'no user' :
                user.role !== 'superAdmin' ? 'not superAdmin' :
                hasFetchedData.current ? 'already fetched' : 'unknown'
      });
    }
  }, []); // EMPTY DEPENDENCY ARRAY - only run on mount
  
  // Debug logging for loading states
  useEffect(() => {
    console.log('AdminRevenueAnalytics: Loading states changed:', {
      revenueLoading,
      loadingStates,
      errors,
      revenueError
    });
  }, [revenueLoading, loadingStates, errors, revenueError]);
  
  // Debug logging only on component mount to prevent re-render loops
  useEffect(() => {
    console.log('Initial revenue data from Redux store:', {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue
    });
    
    // Log detailed structure of daily revenue if available
    if (dailyRevenue && dailyRevenue.length > 0) {
      console.log('Sample daily revenue period structure:', {
        period: dailyRevenue[0],
        hasProductRevenue: 'productRevenue' in dailyRevenue[0],
        hasTotalRevenue: 'totalRevenue' in dailyRevenue[0],
        productRevenueValue: dailyRevenue[0].productRevenue,
        totalRevenueValue: dailyRevenue[0].totalRevenue
      });
    }
  }, []);
  
  // Helper functions for date formatting
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };
  
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
  };
  
  const getEndOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust for Sunday
    return new Date(d.setDate(diff));
  };
  
  // Memoize the filtered data calculation to prevent recalculations
  const getFilteredData = useCallback((data) => {
    if (!data || !Array.isArray(data)) return [];
    
    // Avoid excessive logging
    // console.log('Filtering data:', data);
    
    // Convert date strings to Date objects for comparison
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    // Set time to beginning/end of day for more accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return data.filter(item => {
      // Filter by date
      if (!item) return false;
      
      // Handle different date formats
      let itemDate;
      if (item.date) {
        itemDate = new Date(item.date);
      } else if (item.endDate) {
        itemDate = new Date(item.endDate);
      } else if (item.displayDate) {
        // Try to parse from display date if available
        itemDate = new Date(item.displayDate);
      } else {
        // Default to current date if no date information is available
        return true;
      }
      
      // Check if the date is valid
      if (isNaN(itemDate.getTime())) {
        return true; // Include items with invalid dates rather than filtering them out
      }
      
      const isInDateRange = itemDate >= startDate && itemDate <= endDate;
      return isInDateRange;
    }).map(item => {
      // If admin filter is applied, filter the admin revenue data
      if (selectedAdmin !== 'all' && item.adminRevenue && Array.isArray(item.adminRevenue)) {
        return {
          ...item,
          adminRevenue: item.adminRevenue.filter(admin => admin.adminId === selectedAdmin)
        };
      }
      return item;
    });
  }, [selectedAdmin, dateRange]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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
  
  // Render accordion section
  const renderAccordionSection = (title, data, icon, timeUnit) => {
    const filteredData = getFilteredData(data);
    const isLoading = loadingStates?.[timeUnit] || false;
    const periodError = errors?.[timeUnit];
    
    return (
      <motion.div
        variants={itemVariants}
        className="mb-4 border border-gray-200 rounded-lg overflow-hidden"
      >
        <button
          onClick={() => toggleSection(timeUnit)}
          className={`w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors ${openSection === timeUnit ? 'border-b border-gray-200' : ''}`}
        >
          <div className="flex items-center">
            {icon}
            <span className="ml-2 font-medium text-gray-800">{title}</span>
            <span className="ml-2 text-sm text-gray-500">({filteredData.length} periods)</span>
            {isLoading && (
              <div className="ml-2 flex items-center text-xs text-blue-600">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
            {periodError && !isLoading && (
              <div className="ml-2 flex items-center text-xs text-red-600">
                <span>Error</span>
              </div>
            )}
          </div>
          {openSection === timeUnit ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {openSection === timeUnit && (
          <div className="p-4 bg-white">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto text-blue-300 mb-2 animate-spin" />
                <p className="text-gray-500">Loading {title.toLowerCase()}...</p>
              </div>
            ) : periodError ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <BarChart3 className="h-12 w-12 mx-auto text-red-300 mb-2" />
                  <p className="text-red-500 font-medium">Failed to load {title.toLowerCase()}</p>
                  <p className="text-red-400 text-sm mt-1">{periodError}</p>
                </div>
                <button
                  onClick={() => {
                    dispatch(clearPeriodError(timeUnit));
                    dispatch(fetchAdminRevenueByTime(timeUnit));
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm"
                >
                  <RefreshCw className="h-4 w-4 inline mr-1" />
                  Retry
                </button>
              </div>
            ) : filteredData && filteredData.length > 0 ? (
              <div className="space-y-4">
                {filteredData.map((period, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <CalendarClock className="h-5 w-5 text-blue-500 mr-2" />
                        <h3 className="font-medium text-gray-700">
                          {timeUnit === 'daily' && period.date && formatDate(period.date)}
                          {timeUnit === 'weekly' && period.startDate && period.endDate && (
                            <>Week {getWeekNumber(period.startDate)}: {formatDate(period.startDate)} - {formatDate(period.endDate)}</>
                          )}
                          {timeUnit === 'monthly' && period.month && (
                            `${new Date(2000, period.month - 1, 1).toLocaleString('default', { month: 'long' })} ${period.year}`
                          )}
                          {timeUnit === 'yearly' && period.year && (
                            `${period.year}`
                          )}
                          {/* Debug: Show raw date data */}
                          {process.env.NODE_ENV === 'development' && (
                            <span className="text-xs text-gray-400 ml-2">
                              (Raw: {period.displayDate || period.timePeriodKey})
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Total Revenue</span>
                        <p className="font-bold text-blue-600">{formatCurrency(period.totalRevenue)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded border border-gray-100">
                        <div className="flex items-center mb-1">
                          <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-gray-500">Product Revenue</span>
                        </div>
                        <p className="font-semibold text-gray-800">{formatCurrency(period.productRevenue)}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded border border-gray-100">
                        <div className="flex items-center mb-1">
                          <TruckIcon className="h-4 w-4 text-indigo-500 mr-1" />
                          <span className="text-xs text-gray-500">Shipping Fees</span>
                        </div>
                        <p className="font-semibold text-gray-800">{formatCurrency(calculateShippingFees(period, false))}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded border border-gray-100">
                        <div className="flex items-center mb-1">
                          <Percent className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-xs text-gray-500">Platform Fees</span>
                        </div>
                        <p className="font-semibold text-gray-800">{formatCurrency(period.totalPlatformFees || 0)}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded border border-gray-100">
                        <div className="flex items-center mb-1">
                          <Users className="h-4 w-4 text-purple-500 mr-1" />
                          <span className="text-xs text-gray-500">Active Admins</span>
                        </div>
                        <p className="font-semibold text-gray-800">{period.adminRevenue ? period.adminRevenue.length : 0}</p>
                      </div>
                    </div>
                    
                    {/* Summary Row */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Total Revenue</p>
                          <p className="text-lg font-bold text-blue-800">{formatCurrency(period.totalRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600 font-medium">Net Revenue</p>
                          <p className="text-lg font-bold text-green-800">
                            {formatCurrency((period.productRevenue || 0) - (period.totalPlatformFees || 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-600 font-medium">Avg. Per Admin</p>
                          <p className="text-lg font-bold text-amber-800">
                            {formatCurrency(
                              period.adminRevenue && period.adminRevenue.length > 0 
                                ? period.productRevenue / period.adminRevenue.length 
                                : 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-purple-600 font-medium">Platform Share</p>
                          <p className="text-lg font-bold text-purple-800">
                            {period.productRevenue > 0 
                              ? `${(((period.totalPlatformFees || 0) / period.productRevenue) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Admin Revenue Breakdown */}
                    {period.adminRevenue && period.adminRevenue.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Revenue Breakdown</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {period.adminRevenue.map((admin, adminIndex) => (
                            <div key={adminIndex} className="flex justify-between items-center bg-white p-3 rounded border border-gray-100">
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700">{admin.adminName}</span>
                                <div className="text-xs text-gray-500 mt-1">
                                  {admin.orderCount || 0} orders • {admin.itemsSold || 0} items
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex flex-col gap-1">
                                  <p className="font-bold text-gray-900">
                                    <span className="text-xs text-gray-600 mr-1">Gross:</span>
                                    {formatCurrency(admin.revenue)}
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    <span className="text-gray-600 mr-1">Shipping:</span>
                                    {formatCurrency(admin.shippingFees || 0)}
                                  </p>
                                  <p className="text-xs text-red-600">
                                    <span className="text-gray-600 mr-1">Platform:</span>
                                    {formatCurrency(admin.platformFees || 0)}
                                  </p>
                                  <p className="text-sm text-green-600 font-semibold">
                                    <span className="text-gray-600 mr-1">Net:</span>
                                    {formatCurrency((admin.revenue || 0) - (admin.platformFees || 0))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No data available for the selected filters</p>
                {(revenueError || periodError) && (
                  <p className="text-red-500 mt-2 text-sm">{periodError || revenueError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Admin Revenue Analytics</h2>
          {revenueLoading && (
            <div className="ml-3 flex items-center text-sm text-blue-600">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              <span>Loading data...</span>
            </div>
          )}
          {!revenueLoading && loadingStates && Object.values(loadingStates).some(loading => loading) && (
            <div className="ml-3 flex items-center text-sm text-orange-600">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              <span>Loading some periods...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              console.log('Manual refresh triggered');
              hasFetchedData.current = false; // Reset fetch flag
              dispatch(fetchOrderStats());
              dispatch(fetchAdminRevenueByTime('daily'));
              dispatch(fetchAdminRevenueByTime('weekly'));
              dispatch(fetchAdminRevenueByTime('monthly'));
              dispatch(fetchAdminRevenueByTime('yearly'));
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={ordersLoading || revenueLoading}
          >
            {(ordersLoading || revenueLoading) ? 'Loading...' : 'Refresh Data'}
          </button>
          <button 
            onClick={() => {
              dispatch(fetchOrderStats());
              dispatch(fetchAdminRevenueByTime('daily'));
              dispatch(fetchAdminRevenueByTime('weekly'));
              dispatch(fetchAdminRevenueByTime('monthly'));
              dispatch(fetchAdminRevenueByTime('yearly'));
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            disabled={ordersLoading || revenueLoading}
          >
            <RefreshCw className={`h-5 w-5 ${(ordersLoading || revenueLoading) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>
      
      {/* Authentication check */}
      {(!isAuthenticated || !user || user.role !== 'superAdmin') && (
        <motion.div variants={itemVariants} className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-700">
            <Users className="h-5 w-5 mr-2" />
            <span className="font-medium">Authentication Required</span>
          </div>
          <p className="text-red-600 text-sm mt-1">
            {!isAuthenticated ? 'Please log in to access revenue analytics.' : 
             !user ? 'User data not loaded.' :
             user.role !== 'superAdmin' ? `Access denied. SuperAdmin role required. Current role: ${user.role}` :
             'Unknown authentication issue.'}
          </p>
        </motion.div>
      )}
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div variants={itemVariants} className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-700">
            <strong>Debug Info:</strong> Fetch Status: {hasFetchedData.current ? 'Completed' : 'Pending'} | 
            User: {user?.role || 'None'} | 
            Auth: {isAuthenticated ? 'Yes' : 'No'} | 
            Loading: {revenueLoading ? 'Yes' : 'No'}
          </div>
        </motion.div>
      )}
      
      {/* Filters */}
      <motion.div variants={itemVariants} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Admin filter */}
            <div className="relative">
              <select
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Admins</option>
                {orderStats && orderStats.adminRevenue && orderStats.adminRevenue.map((admin) => (
                  <option key={admin.adminId} value={admin.adminId}>
                    {admin.adminName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date range filter - simplified for demo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDateRange({
                  startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
                  endDate: new Date()
                })}
                className={`px-3 py-2 text-xs rounded-md ${
                  dateRange.startDate.getTime() === new Date(new Date().setDate(new Date().getDate() - 7)).getTime()
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setDateRange({
                  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
                  endDate: new Date()
                })}
                className={`px-3 py-2 text-xs rounded-md ${
                  dateRange.startDate.getTime() === new Date(new Date().setDate(new Date().getDate() - 30)).getTime()
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Last 30 days
              </button>
              <button
                onClick={() => setDateRange({
                  startDate: new Date(new Date().setDate(new Date().getDate() - 90)),
                  endDate: new Date()
                })}
                className={`px-3 py-2 text-xs rounded-md ${
                  dateRange.startDate.getTime() === new Date(new Date().setDate(new Date().getDate() - 90)).getTime()
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Last 90 days
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Accordion sections */}
      <div className="space-y-2">
        {renderAccordionSection(
          "Daily Revenue", 
          dailyRevenue, 
          <Clock className="h-5 w-5 text-blue-600" />, 
          "daily"
        )}
        
        {renderAccordionSection(
          "Weekly Revenue", 
          weeklyRevenue, 
          <CalendarDays className="h-5 w-5 text-green-600" />, 
          "weekly"
        )}
        
        {renderAccordionSection(
          "Monthly Revenue", 
          monthlyRevenue, 
          <CalendarIcon className="h-5 w-5 text-purple-600" />, 
          "monthly"
        )}
        
        {renderAccordionSection(
          "Yearly Revenue", 
          yearlyRevenue, 
          <CalendarRange className="h-5 w-5 text-orange-600" />, 
          "yearly"
        )}
      </div>
    </motion.div>
  );
};

export default AdminRevenueAnalytics;
