import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  fetchVendorPayments, 
  fetchPaymentSummary,
  fetchPaymentDetails,
  createPayment, 
  updatePaymentStatus,
  resetMessages
} from '../../store/super-admin-vendor-payments-slice';
import { 
  DollarSign, 
  Eye, 
  Check, 
  X, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Calendar, 
  Clock, 
  RefreshCw,
  Upload,
  Image,
  File,
  Download,
  TrendingUp,
  Users,
  CreditCard,
  Receipt,
  ChevronRight,
  ExternalLink,
  Paperclip,
  ArrowLeft
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

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      duration: 0.5, 
      bounce: 0.3 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: 50,
    transition: { duration: 0.3 }
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
  } = useSelector(state => state.superAdminVendorPayments);
  
  // Ensure all data properties have default values
  const vendorPayments = rawVendorPayments || [];
  const pagination = rawPagination || { currentPage: 1, totalPages: 1, totalCount: 0 };
  const paymentDetails = rawPaymentDetails || null;
  const summary = rawSummary || {
    totalPaid: 0,
    pendingAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    lastPaymentDate: null,
    lastPaymentAmount: 0,
    totalWithReceipts: 0,
    totalWithoutReceipts: 0
  };
  
  // Component state
  const [activeView, setActiveView] = useState('list'); // 'list', 'details', or 'create'
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [newPayment, setNewPayment] = useState({
    vendorId: '',
    amount: '',
    description: '',
    paymentMethod: 'bank_transfer',
    transactionId: '',
    receiptFile: null
  });
  
  const [filters, setFilters] = useState({
    vendorId: '',
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
    fetchVendors();
  }, [dispatch, currentPage]);
  
  // Fetch vendors
  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/superAdmin/vendor-payments/admins-vendors`, {
        withCredentials: true
      });
      
      if (response.data && Array.isArray(response.data.vendors)) {
        setVendors(response.data.vendors);
      } else {
        toast.error('Failed to load vendors');
        setVendors([]);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error(`Failed to load vendors: ${error.message}`);
      setVendors([]);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Handle errors and success
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetMessages());
    }
    if (success) {
      toast.success(message);
      dispatch(fetchVendorPayments({ page: currentPage }));
      dispatch(fetchPaymentSummary());
      setSelectedPaymentId(null);
      setTimeout(() => dispatch(resetMessages()), 3000);
    }
  }, [error, success, message, dispatch, currentPage]);

  // Handle payment input changes
  const handleNewPaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Only images and PDF files are allowed');
        return;
      }
      setNewPayment(prev => ({ ...prev, receiptFile: file }));
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Only images and PDF files are allowed');
        return;
      }
      setNewPayment(prev => ({ ...prev, receiptFile: file }));
    }
  }, []);

  // Handle payment creation
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('vendorId', newPayment.vendorId);
      formData.append('amount', newPayment.amount);
      formData.append('description', newPayment.description);
      formData.append('paymentMethod', newPayment.paymentMethod);
      formData.append('transactionId', newPayment.transactionId);
      
      if (newPayment.receiptFile) {
        formData.append('receipt', newPayment.receiptFile);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await axios.post('/api/superAdmin/vendor-payments', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        toast.success('Payment created successfully!');
        dispatch(fetchVendorPayments({ page: currentPage }));
        dispatch(fetchPaymentSummary());
        setActiveView('list');
        setNewPayment({
          vendorId: '',
          amount: '',
          description: '',
          paymentMethod: 'bank_transfer',
          transactionId: '',
          receiptFile: null
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to create payment');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

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
  };

  // Handle status update
  const handleUpdateStatus = (paymentId, newStatus) => {
    dispatch(updatePaymentStatus({ paymentId, status: newStatus }));
  };

  // Handle filters
  const handleFilterApply = () => {
    dispatch(fetchVendorPayments({ page: 1, ...filters }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ vendorId: '', status: '', startDate: '', endDate: '' });
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
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-600 text-sm font-medium">Total Paid</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-blue-600 text-xs mt-1">{summary.completedCount} payments</p>
          </div>
          <div className="bg-blue-500 rounded-full p-3">
            <TrendingUp className="h-6 w-6 text-white" />
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
            <p className="text-amber-600 text-xs mt-1">{summary.pendingCount} payments</p>
          </div>
          <div className="bg-amber-500 rounded-full p-3">
            <Clock className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 border border-emerald-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-600 text-sm font-medium">With Receipts</p>
            <p className="text-3xl font-bold text-emerald-900 mt-2">{formatCurrency(summary.totalWithReceipts)}</p>
            <p className="text-emerald-600 text-xs mt-1">Documented payments</p>
          </div>
          <div className="bg-emerald-500 rounded-full p-3">
            <Receipt className="h-6 w-6 text-white" />
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
            <p className="text-purple-600 text-sm font-medium">Active Vendors</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{vendors.length}</p>
            <motion.button 
              className="text-purple-600 text-sm font-medium mt-1 flex items-center hover:text-purple-800 transition-colors"
              onClick={() => setActiveView('create')}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Plus className="h-3 w-3 mr-1" />
              New Payment
            </motion.button>
          </div>
          <div className="bg-purple-500 rounded-full p-3">
            <Users className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Render payments table
  const renderPaymentsTable = () => (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <h3 className="text-xl font-bold text-gray-900">Recent Payments</h3>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
            <motion.button 
              className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => dispatch(fetchVendorPayments({ page: 1 }))}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </motion.button>
            <motion.button 
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              onClick={() => setActiveView('create')}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Payment
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Enhanced Filters */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 gap-4">
            {/* Mobile: Stack all filter fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                <select
                  name="vendorId"
                  value={filters.vendorId}
                  onChange={(e) => setFilters(prev => ({ ...prev, vendorId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">All Vendors</option>
                  {vendors.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.userName} ({vendor.role})
                    </option>
                  ))}
                </select>
              </div>
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
            </div>
            
            {/* Filter Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.button 
                className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                onClick={handleFilterApply}
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
              >
                <Filter className="h-4 w-4 inline mr-2" />
                Apply Filters
              </motion.button>
              <motion.button 
                className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No payments found</p>
            <motion.button 
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              onClick={() => setActiveView('create')}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              Create First Payment
            </motion.button>
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
                {/* Mobile Layout */}
                <div className="block sm:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 rounded-full p-2">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {payment.vendorId?.name || 'Unknown Vendor'}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">{payment.vendorId?.shopName || 'N/A'}</p>
                      </div>
                    </div>
                    <span className={getStatusBadgeClass(payment.status)}>
                      {payment.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {payment.receiptUrl && (
                        <div className="bg-emerald-100 rounded-full p-1">
                          <Receipt className="h-3 w-3 text-emerald-600" />
                        </div>
                      )}
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
                      {payment.status === 'pending' && (
                        <motion.button 
                          className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-100 transition-colors"
                          onClick={() => handleUpdateStatus(payment._id, 'completed')}
                          variants={buttonVariants}
                          initial="initial"
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <Check className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-100 rounded-full p-2">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {payment.vendorId?.name || 'Unknown Vendor'}
                      </h4>
                      <p className="text-sm text-gray-500">{payment.vendorId?.shopName || 'N/A'}</p>
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
                    
                    <div className="flex items-center space-x-2">
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
                      {payment.status === 'pending' && (
                        <motion.button 
                          className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-100 transition-colors"
                          onClick={() => handleUpdateStatus(payment._id, 'completed')}
                          variants={buttonVariants}
                          initial="initial"
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <Check className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
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
                  <p className="text-emerald-600">Payment to {paymentDetails.vendorId?.name}</p>
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

            {/* Vendor Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h5 className="font-bold text-gray-900 mb-4">Vendor Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Name</p>
                  <p className="text-gray-900">{paymentDetails.vendorId?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Shop</p>
                  <p className="text-gray-900">{paymentDetails.vendorId?.shopName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Email</p>
                  <p className="text-gray-900">{paymentDetails.vendorId?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Transaction ID</p>
                  <p className="text-gray-900">{paymentDetails.transactionId || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {paymentDetails.description && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h5 className="font-bold text-blue-900 mb-2">Description</h5>
                <p className="text-blue-800">{paymentDetails.description}</p>
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

            {/* Actions */}
            {paymentDetails.status === 'pending' && (
              <div className="flex space-x-4">
                <motion.button 
                  className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  onClick={() => handleUpdateStatus(paymentDetails._id, 'completed')}
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Check className="h-4 w-4 inline mr-2" />
                  Mark as Completed
                </motion.button>
                <motion.button 
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
                  onClick={() => handleUpdateStatus(paymentDetails._id, 'cancelled')}
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <X className="h-4 w-4 inline mr-2" />
                  Cancel Payment
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  // Create payment inline form
  const renderCreatePaymentInline = () => (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.button
              className="mr-4 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              onClick={() => setActiveView('list')}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <h3 className="text-2xl font-bold flex items-center">
              <CreditCard className="h-6 w-6 mr-3" />
              Create New Payment
            </h3>
          </div>
        </div>
      </div>

      <form onSubmit={handleCreatePayment} className="p-6 space-y-6">
        {/* Vendor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Vendor *
          </label>
          <select
            name="vendorId"
            value={newPayment.vendorId}
            onChange={handleNewPaymentChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="">Choose a vendor...</option>
            {vendors.map(vendor => (
              <option key={vendor._id} value={vendor._id}>
                {vendor.userName} ({vendor.role}) - Balance: {formatCurrency(vendor.balance || 0)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount and Transaction ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (GHS) *
            </label>
            <input 
              type="number" 
              name="amount" 
              value={newPayment.amount}
              onChange={handleNewPaymentChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID
            </label>
            <input 
              type="text" 
              name="transactionId" 
              value={newPayment.transactionId}
              onChange={handleNewPaymentChange}
              placeholder="TXN123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select 
            name="paymentMethod" 
            value={newPayment.paymentMethod}
            onChange={handleNewPaymentChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea 
            rows={3}
            name="description" 
            value={newPayment.description}
            onChange={handleNewPaymentChange}
            placeholder="Payment description or notes..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Receipt Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receipt (Optional)
          </label>
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
              isDragOver 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {newPayment.receiptFile ? (
              <div className="flex items-center justify-center space-x-3">
                {newPayment.receiptFile.type === 'application/pdf' ? (
                  <File className="h-8 w-8 text-red-500" />
                ) : (
                  <Image className="h-8 w-8 text-blue-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{newPayment.receiptFile.name}</p>
                  <p className="text-sm text-gray-500">{(newPayment.receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setNewPayment(prev => ({ ...prev, receiptFile: null }))}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your receipt here, or</p>
                <label className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Choose File
                  <input 
                    type="file" 
                    onChange={handleFileSelect}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, PDF up to 5MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Uploading...</span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex space-x-4 pt-4">
          <motion.button 
            type="button"
            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            onClick={() => setActiveView('list')}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            Cancel
          </motion.button>
          <motion.button 
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading || !newPayment.vendorId || !newPayment.amount}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            {isUploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Check className="h-4 w-4 mr-2" />
                Create Payment
              </div>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6"
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Vendor Payments</h1>
          <p className="text-gray-600">Manage and track payments to your vendors</p>
        </motion.div>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Main Content */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {activeView === 'list' ? (
              <motion.div key="list">
                {renderPaymentsTable()}
              </motion.div>
            ) : activeView === 'details' ? (
              <motion.div key="details">
                {renderPaymentDetailsInline()}
              </motion.div>
            ) : (
              <motion.div key="create">
                {renderCreatePaymentInline()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default VendorPayments;
