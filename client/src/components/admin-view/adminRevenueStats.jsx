import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  BarChart3, 
  Filter, 
  RefreshCw,
  Clock,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Loader2
} from 'lucide-react';
import { fetchAdminRevenue } from '../../store/admin/revenue-slice';

const AdminRevenueStats = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { 
    dailyRevenue, 
    weeklyRevenue, 
    monthlyRevenue, 
    yearlyRevenue, 
    isLoading: revenueLoading,
    error: revenueError 
  } = useSelector(state => state.adminRevenue);
  
  // State for accordion sections
  const [openSection, setOpenSection] = useState('daily');
  
  // State for filters
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  });
  
  // Format currency
  const formatCurrency = (amount) => {
    return `GH₵${parseFloat(amount || 0).toFixed(2)}`;
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
    dispatch(fetchAdminRevenue('daily'));
    dispatch(fetchAdminRevenue('weekly'));
    dispatch(fetchAdminRevenue('monthly'));
    dispatch(fetchAdminRevenue('yearly'));
  };
  
  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, []);
  
  // Log revenue data once when it's loaded
  useEffect(() => {
    if (dailyRevenue.length > 0 && weeklyRevenue.length > 0 && 
        monthlyRevenue.length > 0 && yearlyRevenue.length > 0) {
      console.log('All revenue data loaded successfully');
    }
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
  
  // Filter data based on selected date range
  const getFilteredData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
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
        // This will show all data when no date is specified
        return true;
      }
      
      // Check if the date is valid
      if (isNaN(itemDate.getTime())) {
        return true; // Include items with invalid dates rather than filtering them out
      }
      
      const isInDateRange = itemDate >= startDate && itemDate <= endDate;
      return isInDateRange;
    });
  };
  
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
      <motion.div variants={itemVariants} className="border border-gray-200 rounded-lg overflow-hidden">
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
            {filteredData && filteredData.length > 0 ? (
              <div className="space-y-4">
                {filteredData.map((period, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-800">{period.displayDate || period.dateString}</h4>
                      <div className="text-right">
                        <span className="text-sm text-gray-500 mr-2">Total:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(period.totalRevenue || period.revenue || 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Orders</p>
                            <p className="text-xs text-gray-500">{period.orderCount || 0} orders</p>
                          </div>
                        </div>
                      </div>
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
          <h2 className="text-xl font-bold text-gray-800">My Revenue Analytics</h2>
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
          disabled={revenueLoading}
        >
          <RefreshCw className={`h-5 w-5 ${revenueLoading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>
      
      {/* Filters */}
      <motion.div variants={itemVariants} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setDateRange({
                startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
                endDate: new Date()
              })}
              className={`px-3 py-1 text-xs rounded-full ${
                dateRange.startDate.getTime() === new Date(new Date().setDate(new Date().getDate() - 7)).setHours(0,0,0,0)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 days
            </button>
            
            <button 
              onClick={() => setDateRange({
                startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
                endDate: new Date()
              })}
              className={`px-3 py-1 text-xs rounded-full ${
                dateRange.startDate.getTime() === new Date(new Date().setDate(new Date().getDate() - 30)).setHours(0,0,0,0)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 days
            </button>
            
            <button 
              onClick={() => setDateRange({
                startDate: new Date(new Date().setDate(new Date().getDate() - 90)),
                endDate: new Date()
              })}
              className={`px-3 py-1 text-xs rounded-full ${
                dateRange.startDate.getTime() === new Date(new Date().setDate(new Date().getDate() - 90)).setHours(0,0,0,0)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 90 days
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Revenue Sections */}
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

export default AdminRevenueStats;
