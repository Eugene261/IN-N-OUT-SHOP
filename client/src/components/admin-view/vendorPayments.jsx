import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchVendorPayments, 
  fetchPaymentSummary, 
  fetchPaymentDetails,
  clearPaymentDetails,
  resetMessages
} from '../../store/admin-vendor-payments-slice';
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
    vendorPayments: rawVendorPayments, 
    pagination: rawPagination, 
    paymentDetails: rawPaymentDetails, 
    summary: rawSummary, 
    isLoading, 
    error,
    success,
    message
  } = useSelector(state => state.adminVendorPayments);
  
  // Ensure all data properties have default values
  const vendorPayments = rawVendorPayments || [];
  const pagination = rawPagination || { currentPage: 1, totalPages: 1, totalCount: 0 };
  const paymentDetails = rawPaymentDetails || null;
  const summary = rawSummary || {
    totalPaid: 0,
    pendingAmount: 0,
    paymentCount: 0,
    pendingCount: 0,
    lastPaymentDate: null,
    lastPaymentAmount: 0,
    totalPayments: 0
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
    dispatch(fetchVendorPayments({ page: currentPage }));
    dispatch(fetchPaymentSummary());
  }, [dispatch, currentPage]);

  // Handle errors and success
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetMessages());
    }
    if (success) {
      toast.success(message);
      setTimeout(() => dispatch(resetMessages()), 3000);
    }
  }, [error, success, message, dispatch]);

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
    dispatch(fetchVendorPayments({ page: 1, ...filters }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '' });
    dispatch(fetchVendorPayments({ page: 1 }));
    setCurrentPage(1);
  };

  // Pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 border border-emerald-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-600 text-sm font-medium">Total Received</p>
            <p className="text-3xl font-bold text-emerald-900 mt-2">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-emerald-600 text-xs mt-1">{summary.paymentCount} completed payments</p>
          </div>
          <div className="bg-emerald-500 rounded-full p-3">
            <Wallet className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 border border-amber-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-600 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold text-amber-900 mt-2">{formatCurrency(summary.pendingAmount)}</p>
            <p className="text-amber-600 text-xs mt-1">{summary.pendingCount} pending payments</p>
          </div>
          <div className="bg-amber-500 rounded-full p-3">
            <Clock className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-600 text-sm font-medium">Last Payment</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{formatCurrency(summary.lastPaymentAmount)}</p>
            <p className="text-blue-600 text-xs mt-1">
              {summary.lastPaymentDate ? formatDate(summary.lastPaymentDate) : 'No payments yet'}
            </p>
          </div>
          <div className="bg-blue-500 rounded-full p-3">
            <Calendar className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-600 text-sm font-medium">Total Payments</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{summary.totalPayments}</p>
            <p className="text-purple-600 text-xs mt-1">All payment records</p>
          </div>
          <div className="bg-purple-500 rounded-full p-3">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Render payments list
  const renderPaymentsList = () => (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <h3 className="text-xl font-bold text-gray-900">Payment History</h3>
          <div className="flex space-x-3">
            <motion.button 
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => dispatch(fetchVendorPayments({ page: 1 }))}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Enhanced Filters */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                name="status" 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input 
                type="date" 
                name="startDate" 
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input 
                type="date" 
                name="endDate" 
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex items-end space-x-2">
              <motion.button 
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                onClick={handleFilterApply}
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
              >
                <Filter className="h-4 w-4 inline mr-2" />
                Apply
              </motion.button>
              <motion.button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : vendorPayments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No payment records found</p>
            <p className="text-gray-400 text-sm mt-1">Payments will appear here when processed by the administrator</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendorPayments.map((payment, index) => (
              <motion.div
                key={payment._id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-indigo-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-emerald-100 rounded-full p-2">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {payment.description || 'Vendor Payment'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Method: {payment.paymentMethod}
                        {payment.transactionId && ` • Ref: ${payment.transactionId}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-500">{formatDate(payment.createdAt)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadgeClass(payment.status)}>
                        {payment.status}
                      </span>
                      {payment.receiptUrl && (
                        <div className="bg-emerald-100 rounded-full p-1">
                          <Receipt className="h-4 w-4 text-emerald-600" />
                        </div>
                      )}
                    </div>
                    
                    <motion.button 
                      className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100 transition-colors"
                      onClick={() => handleViewDetails(payment._id)}
                      variants={buttonVariants}
                      initial="initial"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Eye className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
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
      className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          variants={cardVariants}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Earnings</h1>
          <p className="text-gray-600">Track your payment history and earnings from sales</p>
        </motion.div>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Main Content */}
        <div className="space-y-8">
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