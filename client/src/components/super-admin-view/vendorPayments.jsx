import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  fetchVendorPayments, 
  fetchPaymentSummary,
  fetchPaymentDetails,
  createPayment, 
  updatePaymentStatus,
  resetMessages
} from '../../store/super-admin-vendor-payments-slice';
import { DollarSign, Eye, Check, X, Search, Filter, Plus, FileText, Calendar, Clock, RefreshCw } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { toast } from 'sonner';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: custom * 0.1,
      duration: 0.3,
      ease: "easeOut"
    }
  })
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
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
  
  // Ensure all data properties have default values to prevent null reference errors
  const vendorPayments = rawVendorPayments || [];
  const pagination = rawPagination || { currentPage: 1, totalPages: 1, totalCount: 0 };
  const paymentDetails = rawPaymentDetails || null;
  const summary = rawSummary || {
    totalPaid: 0,
    pendingAmount: 0,
    paymentCount: 0,
    pendingCount: 0,
    lastPaymentDate: null,
    lastPaymentAmount: 0
  };
  
  // Component state
  const [activeTab, setActiveTab] = useState('payments');
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendors, setVendors] = useState([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [newPayment, setNewPayment] = useState({
    vendorId: '',
    amount: '',
    periodStart: '',
    periodEnd: '',
    paymentMethod: 'Bank Transfer',
    notes: ''
  });
  const [filters, setFilters] = useState({
    vendorId: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Status colors
  const statusColors = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'secondary'
  };

  // Initial data load
  useEffect(() => {
    dispatch(fetchVendorPayments({ page: currentPage }));
    dispatch(fetchPaymentSummary());
    fetchVendors();
  }, [dispatch, currentPage]);
  
  // Fetch vendors for the dropdown
  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    try {
      console.log('Fetching admins/vendors...');
      // Fetch admin/vendor data from your API - using absolute URL
      // In Vite, environment variables are accessed via import.meta.env, not process.env
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('Using API base URL:', API_BASE_URL);
      const response = await axios.get(`${API_BASE_URL}/api/superAdmin/vendor-payments/admins-vendors`, {
        withCredentials: true
      });
      
      console.log('API response:', response.data);
      
      if (response.data && Array.isArray(response.data.vendors)) {
        setVendors(response.data.vendors);
        console.log('Vendors loaded successfully:', response.data.vendors.length);
      } else {
        console.error('Invalid data format from API');
        toast.error('Failed to load admins/vendors: Invalid data format');
        setVendors([]);
      }
    } catch (error) {
      console.error('Error fetching admins/vendors:', error);
      toast.error(`Failed to load admins/vendors: ${error.message}`);
      setVendors([]);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetMessages());
    }
  }, [error, dispatch]);

  // Update when success status changes
  useEffect(() => {
    if (success) {
      // Reload data after successful action
      dispatch(fetchVendorPayments({ page: currentPage }));
      dispatch(fetchPaymentSummary());
      
      // Clear modals
      setShowPaymentModal(false);
      setShowDetailsModal(false);
      
      // Reset form
      setNewPayment({
        vendorId: '',
        amount: '',
        description: '',
        paymentMethod: 'manual'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        dispatch(resetMessages());
      }, 3000);
    }
  }, [success, dispatch, currentPage]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle applying filters
  const handleFilterApply = () => {
    dispatch(fetchVendorPayments({ 
      page: 1, 
      ...filters 
    }));
    setCurrentPage(1);
  };

  // Handle input change for filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      vendorId: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    dispatch(fetchVendorPayments({ page: 1 }));
    setCurrentPage(1);
  };

  // Handle view payment details
  const handleViewDetails = (paymentId) => {
    setSelectedPaymentId(paymentId);
    dispatch(fetchPaymentDetails(paymentId));
    setShowDetailsModal(true);
  };

  // Handle new payment input change
  const handleNewPaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle payment creation
  const handleCreatePayment = (e) => {
    e.preventDefault();
    dispatch(createPayment(newPayment));
  };

  // Handle payment status update
  const handleUpdateStatus = (paymentId, newStatus) => {
    dispatch(updatePaymentStatus({ paymentId, status: newStatus }));
  };

  // Pagination component
  const PaginationComponent = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    
    const items = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === pagination.currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    return (
      <div className="flex justify-center mt-4">
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Previous
          </button>
          {items}
          <button
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Render payment summary cards
  const renderSummaryCards = () => (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}>
      <div>
        <motion.div 
          className="bg-white rounded-lg shadow p-4 border border-gray-200 overflow-hidden"
          variants={cardVariants}
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
        >
          <h6 className="text-sm font-medium text-gray-600">Total Payments Made</h6>
          <p className="text-2xl font-bold mt-2">{formatCurrency(summary?.totalPaid || 0)}</p>
        </motion.div>
      </div>
      <div>
        <motion.div 
          className="bg-white rounded-lg shadow p-4 border border-gray-200 overflow-hidden"
          variants={cardVariants}
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
        >
          <h6 className="text-sm font-medium text-gray-600">Pending Payments</h6>
          <p className="text-2xl font-bold mt-2 text-yellow-600">{formatCurrency(summary?.totalPending || 0)}</p>
        </motion.div>
      </div>
      <div>
        <motion.div 
          className="bg-white rounded-lg shadow p-4 border border-gray-200 overflow-hidden"
          variants={cardVariants}
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
        >
          <h6 className="text-sm font-medium text-gray-600">Platform Revenue</h6>
          <p className="text-2xl font-bold mt-2">{formatCurrency(summary?.totalPlatformFee || 0)}</p>
        </motion.div>
      </div>
      <div>
        <motion.div 
          className="bg-white rounded-lg shadow p-4 border border-gray-200 overflow-hidden"
          variants={cardVariants}
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
        >
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center"
            onClick={() => setShowPaymentModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </button>
        </motion.div>
      </div>
    </motion.div>
  );

  // Render payment history table
  const renderPaymentsTable = () => (
    <div className="shadow-sm border border-gray-200 rounded">
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h5 className="font-medium">Vendor Payments</h5>
          </div>
          <div>
            <button 
              className="border border-gray-300 bg-white text-gray-700 text-sm px-3 py-1 rounded flex items-center hover:bg-gray-50 mr-2"
              onClick={() => dispatch(fetchVendorPayments({ page: 1 }))}
            >
              <Search className="h-4 w-4 mr-1" /> Refresh
            </button>
          </div>
        </div>
      </div>
      <div className="p-4">
        {/* Filters section */}
        <div className="mb-4 p-3 border rounded">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="col-span-1 md:col-span-1">
              <div className="mb-1">
                <label className="text-sm font-medium text-gray-700">Vendor</label>
                <select
                  name="vendorId"
                  value={filters.vendorId}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                >
                  <option value="">All Vendors</option>
                  {isLoadingVendors ? (
                    <option disabled>Loading vendors...</option>
                  ) : (
                    vendors.map(vendor => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.userName} ({vendor.role})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="col-span-1 md:col-span-1">
              <div className="mb-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select 
                  name="status" 
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="col-span-1 md:col-span-1">
              <div className="mb-1">
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-1">
              <div className="mb-1">
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <input 
                  type="date" 
                  name="endDate" 
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-1 flex items-end">
              <motion.button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm flex items-center"
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={handleFilterApply}
              >
                <Filter className="h-4 w-4 mr-1" /> Apply
              </motion.button>
            </div>
            <div className="col-span-1 md:col-span-1 flex items-end">
              <button 
                className="border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50"
                onClick={handleResetFilters}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Payments table */}
        {isLoading ? (
          <div className="text-center py-5">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : vendorPayments.length === 0 ? (
          <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded mb-4">
            No payments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendorPayments.map(payment => (
                  <tr key={payment._id}>
                    <td>{payment._id.substring(0, 8)}...</td>
                    <td>
                      {payment.vendorId ? (
                        <>
                          <div>{payment.vendorId.name || 'N/A'}</div>
                          <small className="text-muted">{payment.vendorId.shopName || 'N/A'}</small>
                        </>
                      ) : 'Unknown Vendor'}
                    </td>
                    <td className="fw-bold">{formatCurrency(payment.amount)}</td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>
                      <Badge bg={statusColors[payment.status] || 'secondary'}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td>{payment.paymentMethod}</td>
                    <td>
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        className="me-1"
                        onClick={() => handleViewDetails(payment._id)}
                      >
                        Details
                      </Button>
                      {payment.status === 'pending' && (
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          className="me-1"
                          onClick={() => handleUpdateStatus(payment._id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationComponent />
      </div>
    </div>
  );

  // Render vendor payments by vendor chart
  const renderPaymentsByVendor = () => (
    <div className="shadow-sm border border-gray-200 rounded mt-4">
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <h5 className="font-medium">Top Vendor Payments</h5>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-5">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : summary.paymentsByVendor?.length === 0 ? (
          <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded mb-4">
            No payment data available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {summary.paymentsByVendor?.map((vendor, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{vendor.vendorName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{vendor.shopName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">{formatCurrency(vendor.total)}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Render recent payments
  const renderRecentPayments = () => (
    <motion.div 
      className="shadow-sm mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h5 className="m-0 font-medium">Recent Payments</h5>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-5">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          </div>
        ) : summary.recentPayments?.length === 0 ? (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative">No recent payments.</div>
        ) : (
          <div className="table-responsive">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-light">
                <tr>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {summary.recentPayments?.map(payment => (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.vendorId ? (
                        <>
                          <div>{payment.vendorId.name || 'N/A'}</div>
                          <small className="text-gray-500">{payment.vendorId.shopName || 'N/A'}</small>
                        </>
                      ) : 'Unknown Vendor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(payment.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : payment.status === 'cancelled' ? 'bg-red-100 text-red-800' : payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );

  // Create new payment modal
  const renderNewPaymentModal = () => {
    if (!showPaymentModal) return null;
    
    return (
      <motion.div 
        className="bg-white rounded-lg shadow-xl overflow-hidden w-full mb-6 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Create New Vendor Payment
          </h3>
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={() => setShowPaymentModal(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleCreatePayment}>
          <div className="p-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor*</label>
              <select
                name="vendorId"
                value={newPayment.vendorId}
                onChange={handleNewPaymentChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a vendor</option>
                {isLoadingVendors ? (
                  <option disabled>Loading vendors...</option>
                ) : (
                  vendors.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.userName} ({vendor.role})
                    </option>
                  ))
                )}
              </select>
              <p className="text-sm text-gray-500 mt-1">Select the vendor to make payment to.</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (GHS)*</label>
              <input 
                type="number" 
                name="amount" 
                value={newPayment.amount}
                onChange={handleNewPaymentChange}
                placeholder="Enter payment amount"
                step="0.01"
                min="0"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                rows={2}
                name="description" 
                value={newPayment.description}
                onChange={handleNewPaymentChange}
                placeholder="Enter payment description"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select 
                name="paymentMethod" 
                value={newPayment.paymentMethod}
                onChange={handleNewPaymentChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="manual">Manual</option>
                <option value="bank">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <motion.button 
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 ml-2"
              disabled={isLoading || !newPayment.vendorId || !newPayment.amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-2"></div>
                  Processing...
                </>
              ) : (
                'Create Payment'
              )}
            </motion.button>
            <motion.button 
              type="button"
              className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 ml-2"
              onClick={() => setShowPaymentModal(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </motion.div>
    );
  };

  // Payment details modal
  const renderPaymentDetailsModal = () => {
    if (!showDetailsModal) return null;
    
    return (
      <motion.div 
        className="bg-white rounded-lg shadow-xl overflow-hidden w-full mb-6 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Payment Details</h3>
          <motion.button
            className="text-gray-400 hover:text-gray-500"
            onClick={() => setShowDetailsModal(false)}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : !paymentDetails ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">Failed to load payment details.</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h6 className="font-medium">Payment ID</h6>
                  <p className="text-gray-500">{paymentDetails._id}</p>
                </div>
                <div>
                  <h6 className="font-medium">Status</h6>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${paymentDetails.status === 'completed' ? 'bg-green-100 text-green-800' : paymentDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {paymentDetails.status}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h6 className="font-medium">Amount</h6>
                  <h3 className="text-indigo-600 text-xl font-bold">{formatCurrency(paymentDetails.amount)}</h3>
                </div>
                <div>
                  <h6 className="font-medium">Date</h6>
                  <p>{formatDate(paymentDetails.createdAt)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h6 className="font-medium">Vendor Name</h6>
                  <p>{paymentDetails.vendorId?.name || 'N/A'}</p>
                </div>
                <div>
                  <h6 className="font-medium">Shop Name</h6>
                  <p>{paymentDetails.vendorId?.shopName || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h6 className="font-medium">Payment Method</h6>
                  <p>{paymentDetails.paymentMethod}</p>
                </div>
                <div>
                  <h6 className="font-medium">Transaction Type</h6>
                  <p>{paymentDetails.transactionType}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <h6 className="font-medium">Description</h6>
                  <p>{paymentDetails.description || 'No description provided.'}</p>
                </div>
              </div>
              
              {/* Show related order details if available */}
              {paymentDetails.orderId && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <h5 className="font-medium mb-2">Related Order</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <h6 className="font-medium">Order ID</h6>
                      <p className="text-gray-500">{paymentDetails.orderId._id}</p>
                    </div>
                    <div>
                      <h6 className="font-medium">Order Amount</h6>
                      <p>{formatCurrency(paymentDetails.orderId.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
          {paymentDetails && paymentDetails.status === 'pending' && (
            <>
              <motion.button 
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 ml-2"
                onClick={() => handleUpdateStatus(paymentDetails._id, 'completed')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Mark as Completed
              </motion.button>
              <motion.button 
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 ml-2"
                onClick={() => handleUpdateStatus(paymentDetails._id, 'cancelled')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel Payment
              </motion.button>
            </>
          )}
          <motion.button 
            className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 ml-2"
            onClick={() => setShowDetailsModal(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      <h2 className="text-2xl font-bold mb-4">Vendor Payments</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => dispatch(clearError())}
          >
            <X className="h-5 w-5 text-red-500" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{message}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => dispatch(clearSuccess())}
          >
            <X className="h-5 w-5 text-green-500" />
          </button>
        </div>
      )}
      
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              className={`mr-8 py-2 px-1 ${activeTab === 'payments' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('payments')}
            >
              Payments
            </button>
            <button
              className={`py-2 px-1 ${activeTab === 'analytics' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </nav>
        </div>
        <div className="mt-4">
          {activeTab === 'payments' && (
            <>
              {renderSummaryCards()}
              {renderPaymentsTable()}
            </>
          )}
          {activeTab === 'analytics' && (
            <>
              {renderSummaryCards()}
              {renderPaymentsByVendor()}
              {renderRecentPayments()}
            </>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {renderNewPaymentModal()}
      {showDetailsModal && renderPaymentDetailsModal()}
    </motion.div>
  );
};

export default VendorPayments;
