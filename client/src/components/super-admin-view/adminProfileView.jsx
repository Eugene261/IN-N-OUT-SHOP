import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Store, 
  DollarSign, 
  Package, 
  Truck, 
  TrendingUp, 
  ShoppingCart, 
  Star, 
  Globe, 
  Shield, 
  Clock, 
  Activity,
  BarChart3,
  PieChart,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  ExternalLink,
  Settings,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Percent
} from 'lucide-react';
import { fetchAdminProfile, clearProfile, clearError } from '../../store/super-admin/admin-profile-slice';

const AdminProfileView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { adminId } = useParams();
  
  const { currentProfile, isLoading, error } = useSelector(state => state.superAdminProfile);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('allTime');

  useEffect(() => {
    if (adminId) {
      dispatch(fetchAdminProfile(adminId));
    }
    
    return () => {
      dispatch(clearProfile());
    };
  }, [dispatch, adminId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const formatCurrency = (amount) => {
    return `GHS ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superAdmin':
        return 'text-purple-600 bg-purple-100';
      case 'admin':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'revenue', label: 'Revenue Analytics', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Recent Orders', icon: ShoppingCart },
    { id: 'shipping', label: 'Shipping Config', icon: Truck },
    { id: 'shop', label: 'Shop Details', icon: Store }
  ];

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'thisWeek', label: 'This Week' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'thisYear', label: 'This Year' },
    { id: 'allTime', label: 'All Time' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading admin profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/super-admin/users')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No profile data available</p>
        </div>
      </div>
    );
  }

  const { personalInfo, shopConfig, financialInfo, products, shippingZones, revenueAnalytics, recentOrders, statistics } = currentProfile;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/super-admin/users')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to User Management
        </button>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                {personalInfo.avatar ? (
                  <img 
                    src={personalInfo.avatar} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  personalInfo.userName?.charAt(0)?.toUpperCase() || 'A'
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {personalInfo.firstName && personalInfo.lastName 
                    ? `${personalInfo.firstName} ${personalInfo.lastName}`
                    : personalInfo.userName
                  }
                </h1>
                <p className="text-gray-600">{personalInfo.email}</p>
                <div className="flex items-center mt-2 space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(personalInfo.role)}`}>
                    {personalInfo.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(personalInfo.isActive)}`}>
                    {personalInfo.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {shopConfig.shopName && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full text-green-600 bg-green-100">
                      Shop Owner
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-medium">{formatDate(personalInfo.createdAt)}</p>
              <p className="text-sm text-gray-500 mt-2">Last login</p>
              <p className="font-medium">{formatDateTime(personalInfo.lastLogin)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(revenueAnalytics?.allTime?.totalRevenue || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">{statistics?.totalProducts || 0}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-purple-600">
                {revenueAnalytics?.allTime?.totalOrders || 0}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Account Balance</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(financialInfo?.balance || 0)}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Username:</span>
                        <span className="font-medium">{personalInfo.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{personalInfo.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{personalInfo.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-medium">{formatDate(personalInfo.dateOfBirth)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">
                          {shopConfig.baseCity && shopConfig.baseRegion 
                            ? `${shopConfig.baseCity}, ${shopConfig.baseRegion}`
                            : 'Not provided'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Statistics */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Account Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Age:</span>
                        <span className="font-medium">{statistics?.accountAge || 0} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Login:</span>
                        <span className="font-medium">
                          {statistics?.lastLoginDays !== null 
                            ? `${statistics.lastLoginDays} days ago`
                            : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Products:</span>
                        <span className="font-medium text-green-600">{statistics?.activeProducts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Out of Stock:</span>
                        <span className="font-medium text-red-600">{statistics?.outOfStockProducts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping Zones:</span>
                        <span className="font-medium">{statistics?.totalShippingZones || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg. Product Price:</span>
                        <span className="font-medium">{formatCurrency(statistics?.averageProductPrice || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Financial Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialInfo?.totalEarnings || 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(financialInfo?.balance || 0)}
                      </p>
                      <p className="text-sm text-gray-600">Current Balance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(financialInfo?.totalEarningsWithdrawn || 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Withdrawn</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Revenue Analytics Tab */}
            {activeTab === 'revenue' && (
              <motion.div
                key="revenue"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Period Selector */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Revenue Analytics</h3>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {periods.map(period => (
                      <option key={period.id} value={period.id}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>

                {revenueAnalytics?.[selectedPeriod] ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Total Revenue</p>
                          <p className="text-xl font-bold text-green-700">
                            {formatCurrency(revenueAnalytics[selectedPeriod].totalRevenue)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Net Revenue</p>
                          <p className="text-xl font-bold text-blue-700">
                            {formatCurrency(revenueAnalytics[selectedPeriod].netRevenue)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">Total Orders</p>
                          <p className="text-xl font-bold text-purple-700">
                            {revenueAnalytics[selectedPeriod].totalOrders}
                          </p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-purple-500" />
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600">Items Sold</p>
                          <p className="text-xl font-bold text-orange-700">
                            {revenueAnalytics[selectedPeriod].totalItemsSold}
                          </p>
                        </div>
                        <Package className="h-8 w-8 text-orange-500" />
                      </div>
                    </div>

                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-indigo-600">Shipping Fees</p>
                          <p className="text-xl font-bold text-indigo-700">
                            {formatCurrency(revenueAnalytics[selectedPeriod].totalShippingFees)}
                          </p>
                        </div>
                        <Truck className="h-8 w-8 text-indigo-500" />
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600">Platform Fees</p>
                          <p className="text-xl font-bold text-red-700">
                            {formatCurrency(revenueAnalytics[selectedPeriod].totalPlatformFees)}
                          </p>
                        </div>
                        <Percent className="h-8 w-8 text-red-500" />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Avg. Order Value</p>
                          <p className="text-xl font-bold text-gray-700">
                            {formatCurrency(revenueAnalytics[selectedPeriod].averageOrderValue)}
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-gray-500" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No revenue data available for this period</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Products ({products?.length || 0})</h3>
                </div>

                {products && products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 truncate">{product.title}</h4>
                            <p className="text-sm text-gray-500">{product.category} • {product.brand}</p>
                          </div>
                          {product.images && product.images.length > 0 && (
                            <img 
                              src={product.images[0]} 
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded-md ml-3"
                            />
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Price:</span>
                            <span className="font-medium">
                              {product.salePrice ? (
                                <>
                                  <span className="text-green-600">{formatCurrency(product.salePrice)}</span>
                                  <span className="text-gray-400 line-through ml-2 text-xs">
                                    {formatCurrency(product.price)}
                                  </span>
                                </>
                              ) : (
                                formatCurrency(product.price)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <span className={`font-medium ${product.totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {product.totalStock}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Created:</span>
                            <span className="text-sm">{formatDate(product.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No products found</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Recent Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Orders ({recentOrders?.length || 0})</h3>
                </div>

                {recentOrders && recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Admin Revenue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentOrders.map((order) => (
                          <tr key={order.orderId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.orderId.slice(-8)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                                <div className="text-sm text-gray-500">{order.customerEmail}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatCurrency(order.adminRevenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.adminItemsCount} items
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No recent orders found</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Shipping Configuration Tab */}
            {activeTab === 'shipping' && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Shipping Configuration</h3>
                </div>

                {/* Shipping Preferences */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-800 mb-4">Shipping Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Default Base Rate:</span>
                      <span className="font-medium">
                        {formatCurrency(financialInfo?.shippingPreferences?.defaultBaseRate || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Out-of-Region Rate:</span>
                      <span className="font-medium">
                        {formatCurrency(financialInfo?.shippingPreferences?.defaultOutOfRegionRate || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Regional Rates Enabled:</span>
                      <span className={`font-medium ${
                        financialInfo?.shippingPreferences?.enableRegionalRates ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {financialInfo?.shippingPreferences?.enableRegionalRates ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <p><strong>Default Base Rate:</strong> Used when no specific shipping zone is configured for a region</p>
                    <p><strong>Out-of-Region Rate:</strong> Used for deliveries outside the admin's base region</p>
                  </div>
                </div>

                {/* Shipping Zones */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">Shipping Zones ({shippingZones?.length || 0})</h4>
                  {shippingZones && shippingZones.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {shippingZones.map((zone) => (
                        <div key={zone._id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium text-gray-800">{zone.name}</h5>
                              <p className="text-sm text-gray-500">{zone.region}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              zone.isDefault ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {zone.isDefault ? 'Default' : 'Custom'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Base Rate:</span>
                              <span className="font-medium">{formatCurrency(zone.baseRate)}</span>
                            </div>
                            {zone.sameRegionCapFee !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Same Region Cap:</span>
                                <span className="font-medium">{formatCurrency(zone.sameRegionCapFee)}</span>
                              </div>
                            )}
                            {zone.vendorRegion && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Vendor Region:</span>
                                <span className="text-sm">{zone.vendorRegion}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Additional Rates:</span>
                              <span className="text-sm">{zone.additionalRates?.length || 0} rules</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Created:</span>
                              <span className="text-sm">{formatDate(zone.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">No shipping zones configured</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Shop Details Tab */}
            {activeTab === 'shop' && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Shop Details</h3>
                </div>

                {shopConfig.shopName ? (
                  <div className="space-y-6">
                    {/* Shop Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold">{shopConfig.shopName}</h2>
                          <p className="text-blue-100">{shopConfig.shopCategory}</p>
                          {shopConfig.shopRating > 0 && (
                            <div className="flex items-center mt-2">
                              <Star className="h-4 w-4 text-yellow-300 mr-1" />
                              <span>{shopConfig.shopRating.toFixed(1)}</span>
                              <span className="text-blue-100 ml-2">({shopConfig.shopReviewCount} reviews)</span>
                            </div>
                          )}
                        </div>
                        {shopConfig.shopLogo && (
                          <img 
                            src={shopConfig.shopLogo} 
                            alt="Shop Logo"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                      </div>
                    </div>

                    {/* Shop Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-800 mb-4">Shop Information</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Description:</span>
                            <span className="font-medium text-right max-w-xs">
                              {shopConfig.shopDescription || 'Not provided'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Website:</span>
                            <span className="font-medium">
                              {shopConfig.shopWebsite ? (
                                <a 
                                  href={shopConfig.shopWebsite} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center"
                                >
                                  Visit <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              ) : (
                                'Not provided'
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Established:</span>
                            <span className="font-medium">{formatDate(shopConfig.shopEstablished)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium">
                              {shopConfig.baseCity && shopConfig.baseRegion 
                                ? `${shopConfig.baseCity}, ${shopConfig.baseRegion}`
                                : 'Not provided'
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Shop Policies */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-800 mb-4">Shop Policies</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-600 block mb-1">Return Policy:</span>
                            <p className="text-sm text-gray-800">
                              {shopConfig.shopPolicies?.returnPolicy || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 block mb-1">Shipping Policy:</span>
                            <p className="text-sm text-gray-800">
                              {shopConfig.shopPolicies?.shippingPolicy || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 block mb-1">Warranty Policy:</span>
                            <p className="text-sm text-gray-800">
                              {shopConfig.shopPolicies?.warrantyPolicy || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shop Banner */}
                    {shopConfig.shopBanner && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-800 mb-4">Shop Banner</h4>
                        <img 
                          src={shopConfig.shopBanner} 
                          alt="Shop Banner"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No shop information configured</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminProfileView; 