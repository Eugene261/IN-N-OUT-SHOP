import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TruckIcon
} from 'lucide-react';
import { fetchOrderStats } from '../../store/super-admin/orders-slice';
import { fetchAdminRevenueByTime, fetchTimeout } from '../../store/super-admin/revenue-slice';

const AdminRevenueAnalytics = () => {
  const dispatch = useDispatch();
  const { orderStats, isLoading: ordersLoading } = useSelector(state => state.superAdminOrders);
  const { 
    dailyRevenue, 
    weeklyRevenue, 
    monthlyRevenue, 
    yearlyRevenue, 
    isLoading: revenueLoading,
    error: revenueError 
  } = useSelector(state => state.superAdminRevenue);
  
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
    
    // For debugging purposes
    console.log('Calculating shipping fees for:', adminData);
    
    // SuperAdmin dashboard shows the total shipping fees (all admins)
    // Admin dashboard shows only that admin's portion of shipping fees
    
    // For admin-specific data (individual admin lines in superAdmin dashboard)
    if (isAdminSpecific) {
      // Only use direct shipping fees for this admin if available
      if (adminData.shippingFees && parseFloat(adminData.shippingFees) > 0) {
        console.log(`Using direct shipping fees for ${adminData.adminName}: ${adminData.shippingFees}`);
        return parseFloat(adminData.shippingFees);
      }
      
      // NO FALLBACK CALCULATIONS - only real data
      console.log(`No real shipping fees found for ${adminData.adminName}, returning 0`);
      return 0;
    }
    // For total shipping fees (daily/weekly totals in superAdmin dashboard)
    else {
      // If we have direct total shipping fees from the server response
      if (adminData.totalShippingFees && parseFloat(adminData.totalShippingFees) > 0) {
        console.log(`Using totalShippingFees from backend: ${adminData.totalShippingFees}`);
        return parseFloat(adminData.totalShippingFees);
      }
      
      // If we have shipping fees directly on the period object (added by backend)
      if (adminData.shippingFees && parseFloat(adminData.shippingFees) > 0) {
        console.log(`Using period-level shippingFees: ${adminData.shippingFees}`);
        return parseFloat(adminData.shippingFees);
      }
      
      // Otherwise sum up all admin shipping fees if available
      if (adminData.adminRevenue && Array.isArray(adminData.adminRevenue)) {
        const totalFromAdmins = adminData.adminRevenue.reduce((total, admin) => {
          return total + calculateShippingFees(admin, true);
        }, 0);
        console.log(`Calculated total shipping fees from admins: ${totalFromAdmins}`);
        return totalFromAdmins;
      }
      
      // NO FALLBACK CALCULATIONS - only real data
      console.log('No real shipping fees found, returning 0');
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
  
  // Refresh data
  const refreshData = () => {
    dispatch(fetchOrderStats());
    dispatch(fetchAdminRevenueByTime('daily'));
    dispatch(fetchAdminRevenueByTime('weekly'));
    dispatch(fetchAdminRevenueByTime('monthly'));
    dispatch(fetchAdminRevenueByTime('yearly'));
  };
  
  // Initial data fetch with timeout protection
  useEffect(() => {
    // Set a loading timeout to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      if (revenueLoading) {
        console.log('Revenue data fetch timeout - continuing with available data');
        // Dispatch to set loading state to false in Redux
        dispatch({ type: 'superAdminRevenue/fetchTimeout' });
      }
    }, 10000); // 10 second timeout
    
    refreshData();
    
    // Clear timeout on component unmount
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Debug logging only on component mount to prevent re-render loops
  useEffect(() => {
    console.log('Initial revenue data from Redux store:', {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue
    });
  }, []);
  
  // Helper functions for date formatting
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
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
  
  // Filter data based on selected admin and date range - memoized to prevent recalculations
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
          </div>
          {openSection === timeUnit ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {openSection === timeUnit && (
          <div className="p-4 bg-white">
            {revenueLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto text-blue-300 mb-2 animate-spin" />
                <p className="text-gray-500">Loading revenue data...</p>
              </div>
            ) : filteredData && filteredData.length > 0 ? (
              <div className="space-y-4">
                {filteredData.map((period, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-800">{period.displayDate || period.dateString}</h4>
                      {period.adminRevenue && period.adminRevenue.length > 0 && (
                        <div className="text-right">
                          <div>
                            <span className="text-sm text-gray-500 mr-2">Gross:</span>
                            <span className="font-bold text-gray-900">
                              {formatCurrency(period.adminRevenue.reduce((total, admin) => total + (parseFloat(admin.revenue) || 0), 0))}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 mr-2">Shipping:</span>
                            <span className="text-xs text-blue-600">
                              {formatCurrency(calculateShippingFees(period, false))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {period.adminRevenue && period.adminRevenue.length > 0 ? (
                        period.adminRevenue.map((admin, adminIndex) => (
                          <div 
                            key={adminIndex}
                            className="flex items-center justify-between p-2 bg-white rounded border border-gray-100"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <Users className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{admin.adminName}</p>
                                <p className="text-xs text-gray-500">{admin.orderCount} orders</p>
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
                                  {formatCurrency(calculateShippingFees(admin))}
                                </p>
                                {admin.shippingFeesByRegion && (
                                  <p className="text-xxs text-gray-500 ml-14">
                                    ({admin.shippingFeesByRegion.accra || 0} Accra, {admin.shippingFeesByRegion.other || 0} other regions)
                                  </p>
                                )}
                                <p className="text-xs text-red-600">
                                  <span className="text-gray-600 mr-1">Fees:</span>
                                  {formatCurrency(admin.platformFees || 0)}
                                </p>
                                <p className="text-sm text-green-600 font-semibold">
                                  <span className="text-gray-600 mr-1">Net:</span>
                                  {formatCurrency((admin.revenue || 0) - (admin.platformFees || 0))}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No admin revenue data for this period</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No data available for the selected filters</p>
                {revenueError && (
                  <p className="text-red-500 mt-2 text-sm">{revenueError}</p>
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
        </div>
        <button 
          onClick={refreshData}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          disabled={ordersLoading || revenueLoading}
        >
          <RefreshCw className={`h-5 w-5 ${(ordersLoading || revenueLoading) ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>
      
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
