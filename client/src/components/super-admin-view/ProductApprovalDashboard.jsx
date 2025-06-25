import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MessageSquare, 
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  ShoppingBag,
  User,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
  fetchPendingProducts,
  fetchAllProducts,
  fetchApprovalStats,
  approveProduct,
  rejectProduct,
  checkFeatureFlags,
  setActiveTab,
  setSearchTerm,
  setCurrentPage,
  openModal,
  closeModal,
  clearError,
  selectPendingProducts,
  selectAllProducts,
  selectApprovalStats,
  selectLoading,
  selectActionLoading,
  selectError,
  selectCurrentPage,
  selectTotalPages,
  selectActiveTab,
  selectSearchTerm,
  selectSelectedProduct,
  selectModalOpen,
  selectFeatureFlags,
  selectFilteredProducts
} from '../../store/super-admin/product-approval-slice';

const ProductApprovalDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // Redux state
  const pendingProducts = useSelector(selectPendingProducts);
  const allProducts = useSelector(selectAllProducts);
  const stats = useSelector(selectApprovalStats);
  const loading = useSelector(selectLoading);
  const actionLoading = useSelector(selectActionLoading);
  const activeTab = useSelector(selectActiveTab);
  const searchTerm = useSelector(selectSearchTerm);
  const selectedProduct = useSelector(selectSelectedProduct);
  const modalOpen = useSelector(selectModalOpen);
  const error = useSelector(selectError);
  const currentPage = useSelector(selectCurrentPage);
  const totalPages = useSelector(selectTotalPages);
  const featureFlags = useSelector(selectFeatureFlags);
  const filteredProducts = useSelector(selectFilteredProducts);
  
  // Local state for comments
  const [approvalComments, setApprovalComments] = useState('');

  useEffect(() => {
    dispatch(checkFeatureFlags());
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, dispatch]);

  const fetchData = async () => {
    try {
      if (!featureFlags.productApproval.enabled) {
        toast.error('Product approval system is currently disabled');
        return;
      }

      // Fetch stats first
      dispatch(fetchApprovalStats());

      if (activeTab === 'pending') {
        dispatch(fetchPendingProducts({ page: currentPage, limit: 10 }));
      } else {
        const status = activeTab !== 'all' ? activeTab : '';
        dispatch(fetchAllProducts({ page: currentPage, limit: 20, status }));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load approval data');
    }
  };

  const handleApproveProduct = async (productId, comments = '') => {
    try {
      const result = await dispatch(approveProduct({ productId, comments })).unwrap();
      toast.success('Product approved successfully!');
      setApprovalComments('');
      // Refresh stats
      dispatch(fetchApprovalStats());
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error(error.message || 'Failed to approve product');
    }
  };

  const handleRejectProduct = async (productId, comments) => {
    if (!comments || comments.trim().length < 10) {
      toast.error('Please provide detailed rejection reason (minimum 10 characters)');
      return;
    }

    try {
      const result = await dispatch(rejectProduct({ productId, comments })).unwrap();
      toast.success('Product rejected with feedback sent to admin');
      setApprovalComments('');
      // Refresh stats
      dispatch(fetchApprovalStats());
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error(error.message || 'Failed to reject product');
    }
  };

  const openApprovalModal = (product) => {
    dispatch(openModal(product));
    setApprovalComments('');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // filteredProducts is now handled by Redux selector

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Approval Dashboard</h1>
              <p className="text-gray-600">Review and manage product submissions from admins</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.stats.byStatus.find(s => s._id === 'pending')?.count || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.stats.byStatus.find(s => s._id === 'approved')?.count || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.stats.byStatus.find(s => s._id === 'rejected')?.count || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Review Time</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.stats.approvalTimes?.avgApprovalTimeHours 
                      ? `${Math.round(stats.stats.approvalTimes.avgApprovalTimeHours)}h`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs and Search */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4">
              <nav className="flex space-x-8">
                {[
                  { key: 'pending', label: 'Pending Review', count: stats?.stats.byStatus.find(s => s._id === 'pending')?.count || 0 },
                  { key: 'all', label: 'All Products', count: stats?.stats.total || 0 },
                  { key: 'approved', label: 'Approved', count: stats?.stats.byStatus.find(s => s._id === 'approved')?.count || 0 },
                  { key: 'rejected', label: 'Rejected', count: stats?.stats.byStatus.find(s => s._id === 'rejected')?.count || 0 }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => dispatch(setActiveTab(tab.key))}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>

              <div className="mt-4 sm:mt-0 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={product.image || '/placeholder-product.jpg'}
                      alt={product.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {product.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {product.description?.substring(0, 100)}...
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-3">
                            <span className="text-sm text-gray-600">
                              <ShoppingBag className="w-4 h-4 inline mr-1" />
                              {product.category}
                            </span>
                            <span className="text-sm text-gray-600">
                              <User className="w-4 h-4 inline mr-1" />
                              {product.createdBy?.userName}
                            </span>
                            <span className="text-sm text-gray-600">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {new Date(product.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 ml-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              Gh₵{product.price}
                            </p>
                            <p className="text-sm text-gray-500">
                              Stock: {product.totalStock}
                            </p>
                          </div>
                          
                          {getStatusBadge(product.approvalStatus)}
                        </div>
                      </div>

                      {product.approvalStatus === 'pending' && (
                        <div className="flex items-center space-x-3 mt-4">
                          <button
                            onClick={() => handleApproveProduct(product._id)}
                            disabled={actionLoading === product._id}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Quick Approve
                          </button>
                          
                          <button
                            onClick={() => openApprovalModal(product)}
                            disabled={actionLoading === product._id}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </button>
                        </div>
                      )}

                      {product.approvalComments && (
                        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <MessageSquare className="w-4 h-4 inline mr-1" />
                            {product.approvalComments}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-12">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === 'pending' 
                    ? 'No products are currently pending approval.' 
                    : 'No products match your search criteria.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => dispatch(setCurrentPage(Math.max(currentPage - 1, 1)))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => dispatch(setCurrentPage(Math.min(currentPage + 1, totalPages)))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Approval Modal */}
        <AnimatePresence>
          {modalOpen && selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => dispatch(closeModal())}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Review Product: {selectedProduct.title}
                    </h2>
                    <button
                      onClick={() => dispatch(closeModal())}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <img
                        src={selectedProduct.image || '/placeholder-product.jpg'}
                        alt={selectedProduct.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Price</label>
                        <p className="text-lg font-semibold">Gh₵{selectedProduct.price}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <p>{selectedProduct.category}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Stock</label>
                        <p>{selectedProduct.totalStock} units</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Submitted by</label>
                        <p>{selectedProduct.createdBy?.userName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-600 mt-1">{selectedProduct.description}</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (optional for approval, required for rejection)
                    </label>
                    <textarea
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add comments about image quality, content appropriateness, etc..."
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => dispatch(closeModal())}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={() => handleRejectProduct(selectedProduct._id, approvalComments)}
                      disabled={actionLoading === selectedProduct._id}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 mr-1 inline" />
                      Reject
                    </button>
                    
                    <button
                      onClick={() => handleApproveProduct(selectedProduct._id, approvalComments)}
                      disabled={actionLoading === selectedProduct._id}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-1 inline" />
                      Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductApprovalDashboard; 