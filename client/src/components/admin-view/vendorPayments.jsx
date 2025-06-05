import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchPaymentHistory, 
  fetchPaymentSummary, 
  fetchPaymentDetails,
  clearPaymentDetails,
  clearError
} from '../../store/admin/vendor-payment-slice/vendorPaymentSlice';
import { 
  DollarSign, 
  Eye, 
  Check, 
  X, 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  Clock, 
  RefreshCw,
  Download,
  TrendingUp,
  CreditCard,
  Receipt,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  Wallet,
  Activity,
  BarChart3
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const slideVariants = {
  hidden: { x: 300, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      duration: 0.5, 
      bounce: 0.2 
    }
  },
  exit: { 
    x: 300, 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 }
};

const VendorPayments = () => {
  const dispatch = useDispatch();
  const { 
    paymentHistory: rawPaymentHistory, 
    pagination: rawPagination, 
    paymentDetails: rawPaymentDetails, 
    summary: rawSummary, 
    isLoading, 
    error
  } = useSelector(state => state.adminVendorPayment);
  
  // Ensure all data properties have default values
  const vendorPayments = rawPaymentHistory || [];
  const pagination = rawPagination || { currentPage: 1, totalPages: 1, totalItems: 0 };
  const paymentDetails = rawPaymentDetails || null;
  const summary = rawSummary || {
    totalEarnings: 0,
    platformFees: 0,
    totalWithdrawn: 0,
    currentBalance: 0,
    recentPayments: []
  };
  
  // Component state
  const [activeView, setActiveView] = useState('list'); // 'list' or 'details'
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  // Status badge styling
  const getStatusBadgeClass = (status) => {
    const baseClass = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'completed':
        return `${baseClass} bg-emerald-100 text-emerald-800 border border-emerald-200`;
      case 'pending':
        return `${baseClass} bg-amber-100 text-amber-800 border border-amber-200`;
      case 'failed':
        return `${baseClass} bg-red-100 text-red-800 border border-red-200`;
      case 'cancelled':
        return `${baseClass} bg-gray-100 text-gray-800 border border-gray-200`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  // Payment method icons
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'bank_transfer':
      case 'Bank Transfer':
        return <CreditCard className="h-4 w-4" />;
      case 'mobile_money':
      case 'Mobile Money':
        return <DollarSign className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  // Initial data load
  useEffect(() => {
    dispatch(fetchPaymentHistory({ page: currentPage }));
    dispatch(fetchPaymentSummary());
  }, [dispatch, currentPage]);

  // Handle errors and success
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Handle view payment details
  const handleViewDetails = (paymentId) => {
    setSelectedPaymentId(paymentId);
    dispatch(fetchPaymentDetails(paymentId));
    setActiveView('details');
  };

  // Handle back to list
  const handleBackToList = () => {
    setActiveView('list');
    setSelectedPaymentId(null);
    dispatch(clearPaymentDetails());
  };

  // Handle filters
  const handleFilterApply = () => {
    dispatch(fetchPaymentHistory({ page: 1, ...filters }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '' });
    dispatch(fetchPaymentHistory({ page: 1 }));
    setCurrentPage(1);
  };

  // Pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <motion.div 
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-emerald-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-emerald-600 text-xs sm:text-sm font-medium">Total Earnings</p>
            <div className="bg-emerald-500 rounded-full p-2 sm:p-3">
              <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-emerald-900">{formatCurrency(summary.totalEarnings)}</p>
          <p className="text-emerald-600 text-xs">Lifetime earnings</p>
        </div>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-amber-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-amber-600 text-xs sm:text-sm font-medium">Platform Fees</p>
            <div className="bg-amber-500 rounded-full p-2 sm:p-3">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-amber-900">{formatCurrency(summary.platformFees)}</p>
          <p className="text-amber-600 text-xs">Total deductions</p>
        </div>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-blue-600 text-xs sm:text-sm font-medium">Total Withdrawn</p>
            <div className="bg-blue-500 rounded-full p-2 sm:p-3">
              <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-blue-900">{formatCurrency(summary.totalWithdrawn)}</p>
          <p className="text-blue-600 text-xs">Amount received</p>
        </div>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-purple-600 text-xs sm:text-sm font-medium">Current Balance</p>
            <div className="bg-purple-500 rounded-full p-2 sm:p-3">
              <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-purple-900">{formatCurrency(summary.currentBalance)}</p>
          <p className="text-purple-600 text-xs">Available balance</p>
        </div>
      </motion.div>
    </motion.div>
  );

  // Render payments list
  const renderPaymentsList = () => (
    <motion.div 
      className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Payment History</h3>
          <div className="flex space-x-2 sm:space-x-3">
            <motion.button 
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => dispatch(fetchPaymentHistory({ page: 1 }))}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Refresh
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        {/* Enhanced Filters */}
        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
              <select 
                name="status" 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md sm:rounded-lg bg-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Start Date</label>
              <input 
                type="date" 
                name="startDate" 
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md sm:rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">End Date</label>
              <input 
                type="date" 
                name="endDate" 
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md sm:rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex items-end space-x-1 sm:space-x-2 col-span-1 sm:col-span-2 lg:col-span-1">
              <motion.button 
                className="flex-1 bg-indigo-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 transition-colors"
                onClick={handleFilterApply}
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Apply
              </motion.button>
              <motion.button 
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={handleResetFilters}
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
              >
                Reset
              </motion.button>
            </div>
          </div>
        </div>

        {/* Payment Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : vendorPayments.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Receipt className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-base sm:text-lg">No payment records found</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Payments will appear here when processed by the administrator</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {vendorPayments.map((payment, index) => (
              <motion.div
                key={payment._id}
                className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-200 hover:border-indigo-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                    <div className="bg-emerald-100 rounded-full p-2 flex-shrink-0">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {payment.description || 'Vendor Payment'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Method: {payment.paymentMethod}
                        {payment.transactionId && ` • Ref: ${payment.transactionId}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-base sm:text-lg text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{formatDate(payment.createdAt)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadgeClass(payment.status)}>
                        {payment.status}
                      </span>
                      {payment.receiptUrl && (
                        <div className="bg-emerald-100 rounded-full p-1">
                          <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                        </div>
                      )}
                    </div>
                    
                    <motion.button 
                      className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100 transition-colors flex-shrink-0"
                      onClick={() => handleViewDetails(payment._id)}
                      variants={buttonVariants}
                      initial="initial"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex justify-center">
            <div className="flex space-x-1 sm:space-x-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <motion.button
                  key={page}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePageChange(page)}
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  {page}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  // Render payment details inline
  const renderPaymentDetailsInline = () => (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.button
              className="mr-4 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              onClick={handleBackToList}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <h3 className="text-2xl font-bold flex items-center">
              <Receipt className="h-6 w-6 mr-3" />
              Payment Details
            </h3>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : !paymentDetails ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Failed to load payment details</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Payment Overview */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-2xl font-bold text-emerald-900">{formatCurrency(paymentDetails.amount)}</h4>
                  <p className="text-emerald-600">{paymentDetails.description || 'Vendor Payment'}</p>
                </div>
                <span className={getStatusBadgeClass(paymentDetails.status)}>
                  {paymentDetails.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Payment ID</p>
                  <p className="text-gray-900">{paymentDetails._id.substring(0, 12)}...</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Date</p>
                  <p className="text-gray-900">{formatDate(paymentDetails.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Method</p>
                  <p className="text-gray-900 flex items-center">
                    {getPaymentMethodIcon(paymentDetails.paymentMethod)}
                    <span className="ml-2">{paymentDetails.paymentMethod}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h5 className="font-bold text-gray-900 mb-4">Transaction Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Description</p>
                  <p className="text-gray-900">{paymentDetails.description || 'Vendor Payment'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Transaction ID</p>
                  <p className="text-gray-900">{paymentDetails.transactionId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Payment Method</p>
                  <p className="text-gray-900">{paymentDetails.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Platform Fee</p>
                  <p className="text-gray-900">{formatCurrency(paymentDetails.platformFee || 0)}</p>
                </div>
              </div>
            </div>

            {/* Processed By */}
            {paymentDetails.createdBy && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h5 className="font-bold text-blue-900 mb-2">Processed By</h5>
                <p className="text-blue-800">{paymentDetails.createdBy.userName || 'Administrator'}</p>
                <p className="text-blue-600 text-sm">{paymentDetails.createdBy.email || ''}</p>
              </div>
            )}

            {/* Receipt */}
            {paymentDetails.receiptUrl && (
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-purple-900 mb-2">Receipt</h5>
                    <p className="text-purple-700">{paymentDetails.receiptName || 'Receipt file'}</p>
                  </div>
                  <motion.a
                    href={`${API_BASE_URL}${paymentDetails.receiptUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    variants={buttonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Receipt
                  </motion.a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100 p-3 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-4 sm:mb-8"
          variants={cardVariants}
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">My Earnings</h1>
          <p className="text-gray-600 text-sm sm:text-base">Track your payment history and earnings from sales</p>
        </motion.div>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-8">
          <AnimatePresence mode="wait">
            {activeView === 'list' ? (
              <motion.div key="list">
                {renderPaymentsList()}
              </motion.div>
            ) : (
              <motion.div key="details">
                {renderPaymentDetailsInline()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default VendorPayments; 