import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  RefreshCw,
  ShoppingBag,
  Calendar,
  AlertTriangle,
  Edit
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
  fetchMyProductStatus,
  checkProductApprovalFeature,
  setActiveFilter,
  clearError,
  selectProducts,
  selectStats,
  selectLoading,
  selectError,
  selectActiveFilter,
  selectFeatureEnabled,
  selectFilteredProducts
} from '../../store/admin/product-status-slice';

const ProductApprovalStatus = () => {
  const { user } = useSelector(state => state.auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [activeFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Check if feature is enabled
      const featureCheck = await axios.get(`${API_URL}/api/feature-flags/status`);
      if (!featureCheck.data.data.productApproval.enabled) {
        // If disabled, don't show approval status
        return;
      }

      const endpoint = activeFilter === 'all' 
        ? `${API_URL}/api/admin/products/my-products?includeApprovalStatus=true`
        : `${API_URL}/api/admin/products/my-products?includeApprovalStatus=true&approvalStatus=${activeFilter}`;

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setProducts(response.data.data);
        
        // Calculate stats
        const statusCounts = response.data.data.reduce((acc, product) => {
          acc[product.approvalStatus] = (acc[product.approvalStatus] || 0) + 1;
          return acc;
        }, {});

        setStats({
          total: response.data.data.length,
          pending: statusCounts.pending || 0,
          approved: statusCounts.approved || 0,
          rejected: statusCounts.rejected || 0
        });
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response?.status === 503) {
        toast.error('Product approval system is temporarily unavailable');
      } else {
        toast.error('Failed to load product status');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock,
        label: 'Under Review'
      },
      approved: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        label: 'Approved'
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle,
        label: 'Needs Revision'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <IconComponent className="w-4 h-4 mr-2" />
        {config.label}
      </span>
    );
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      pending: 'Your product is being reviewed by our team. This usually takes 24-48 hours.',
      approved: 'Great! Your product has been approved and is now live on the platform.',
      rejected: 'Your product needs some revisions. Please check the feedback below and resubmit.'
    };
    return descriptions[status] || '';
  };

  const handleEditProduct = (productId) => {
    // Navigate to edit product page
    window.location.href = `/admin/products/edit/${productId}`;
  };

  if (loading) {
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Approval Status</h1>
              <p className="text-gray-600">Track the approval status of your product submissions</p>
            </div>
            <button
              onClick={fetchProducts}
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
                  <ShoppingBag className="h-8 w-8 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
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
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Under Review</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
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
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
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
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Need Revision</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-4">
              {[
                { key: 'all', label: 'All Products', count: stats?.total || 0 },
                { key: 'pending', label: 'Under Review', count: stats?.pending || 0 },
                { key: 'approved', label: 'Approved', count: stats?.approved || 0 },
                { key: 'rejected', label: 'Need Revision', count: stats?.rejected || 0 }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeFilter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Products List */}
          <div className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeFilter === 'all' 
                    ? 'You haven\'t submitted any products yet.' 
                    : `No products are currently ${activeFilter}.`
                  }
                </p>
              </div>
            ) : (
              products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={product.image || '/placeholder-product.jpg'}
                      alt={product.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {product.title}
                          </h3>
                          
                          <p className="text-sm text-gray-500 mb-3">
                            {product.description?.substring(0, 120)}...
                          </p>
                          
                          <div className="flex items-center space-x-4 mb-3">
                            <span className="text-sm text-gray-600">
                              Category: {product.category}
                            </span>
                            <span className="text-sm text-gray-600">
                              Price: Gh₵{product.price}
                            </span>
                            <span className="text-sm text-gray-600">
                              Stock: {product.totalStock}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4">
                            {getStatusBadge(product.approvalStatus)}
                            
                            <span className="text-sm text-gray-500">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Submitted {new Date(product.submittedAt || product.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mt-2">
                            {getStatusDescription(product.approvalStatus)}
                          </p>

                          {/* Approval Comments */}
                          {product.approvalComments && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-blue-900">
                                    {product.approvalStatus === 'approved' ? 'Approval Note:' : 'Feedback:'}
                                  </p>
                                  <p className="text-sm text-blue-800 mt-1">
                                    {product.approvalComments}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-3 mt-4">
                            {product.approvalStatus === 'rejected' && (
                              <button
                                onClick={() => handleEditProduct(product._id)}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit & Resubmit
                              </button>
                            )}
                            
                            {product.approvalStatus === 'pending' && (
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>Typically reviewed within 24-48 hours</span>
                              </div>
                            )}

                            {product.approvalStatus === 'approved' && (
                              <div className="flex items-center space-x-2 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Live on platform</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Help Section */}
        {stats && stats.pending > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900">
                  Products Under Review
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  You have {stats.pending} product{stats.pending !== 1 ? 's' : ''} currently under review. 
                  Our team typically reviews submissions within 24-48 hours. You'll receive an email notification 
                  once the review is complete.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductApprovalStatus; 