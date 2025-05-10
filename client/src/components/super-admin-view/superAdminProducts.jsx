import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchAllProducts, 
  fetchProductsByAdmin, 
  setSelectedAdmin, 
  clearSelectedAdmin 
} from '../../store/super-admin/products-slice';
import { fetchUsersByRole } from '../../store/super-admin/user-slice';
import { 
  Package, 
  User, 
  Search, 
  Filter, 
  X, 
  AlertCircle, 
  Loader2, 
  ShoppingCart, 
  DollarSign, 
  Tag, 
  Eye 
} from 'lucide-react';

const SuperAdminProducts = () => {
  const dispatch = useDispatch();
  const { products, filteredProducts, selectedAdmin, isLoading, error } = useSelector(state => state.superAdminProducts);
  const { users } = useSelector(state => state.superAdminUsers);
  
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [expandedProducts, setExpandedProducts] = useState({});
  
  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchUsersByRole('admin'));
  }, [dispatch]);
  
  useEffect(() => {
    if (users && users.length > 0) {
      setAdminUsers(users);
    }
  }, [users]);
  
  // Toggle product expansion
  const toggleProductExpansion = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };
  
  // Handle admin selection
  const handleAdminSelect = (admin) => {
    if (admin) {
      dispatch(setSelectedAdmin(admin));
      dispatch(fetchProductsByAdmin(admin._id));
    } else {
      dispatch(clearSelectedAdmin());
      dispatch(fetchAllProducts());
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return `GH₵${parseFloat(amount || 0).toFixed(2)}`;
  };
  
  // Get stock status badge
  const getStockBadge = (stock) => {
    if (stock === 0) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    } else if (stock < 10) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Low Stock: {stock}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          In Stock: {stock}
        </span>
      );
    }
  };
  
  // Get unique categories from products
  const getUniqueCategories = () => {
    const productsToUse = selectedAdmin ? filteredProducts : products;
    const categories = new Set();
    
    productsToUse.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    
    return Array.from(categories);
  };
  
  // Filter products by search term, category, and stock
  const getFilteredProducts = () => {
    const productsToFilter = selectedAdmin ? filteredProducts : products;
    
    return productsToFilter.filter(product => {
      // Category filter
      if (categoryFilter !== 'all' && product.category !== categoryFilter) {
        return false;
      }
      
      // Stock filter
      if (stockFilter === 'outOfStock' && product.stock !== 0) {
        return false;
      } else if (stockFilter === 'lowStock' && (product.stock === 0 || product.stock >= 10)) {
        return false;
      } else if (stockFilter === 'inStock' && product.stock < 10) {
        return false;
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = product.title.toLowerCase().includes(searchLower);
        const descriptionMatch = product.description?.toLowerCase().includes(searchLower);
        const categoryMatch = product.category?.toLowerCase().includes(searchLower);
        
        return titleMatch || descriptionMatch || categoryMatch;
      }
      
      return true;
    });
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
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
  
  const uniqueCategories = getUniqueCategories();
  const filteredProductsList = getFilteredProducts();
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Products Management</h1>
        <p className="text-gray-600">View and manage all products across the platform</p>
      </motion.div>
      
      {error && (
        <motion.div
          variants={itemVariants}
          className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center"
        >
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}
      
      {/* Filters and Search */}
      <motion.div 
        variants={itemVariants}
        className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Admin Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Admin
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedAdmin ? selectedAdmin._id : ''}
            onChange={(e) => {
              const adminId = e.target.value;
              if (adminId === '') {
                handleAdminSelect(null);
              } else {
                const admin = adminUsers.find(a => a._id === adminId);
                handleAdminSelect(admin);
              }
            }}
          >
            <option value="">All Admins</option>
            {adminUsers.map(admin => (
              <option key={admin._id} value={admin._id}>
                {admin.userName}
              </option>
            ))}
          </select>
        </div>
        
        {/* Category Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Category
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        {/* Stock Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Stock
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Stock Levels</option>
            <option value="inStock">In Stock (10+)</option>
            <option value="lowStock">Low Stock (1-9)</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div>
        
        {/* Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Products
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by title or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Active Filters */}
      {(selectedAdmin || categoryFilter !== 'all' || stockFilter !== 'all' || searchTerm) && (
        <motion.div 
          variants={itemVariants}
          className="mb-6 flex flex-wrap items-center gap-2"
        >
          <span className="text-sm text-gray-600 mr-2">Active Filters:</span>
          
          {selectedAdmin && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full flex items-center">
              <User className="h-3 w-3 mr-1" />
              Admin: {selectedAdmin.userName}
              <button
                className="ml-1 text-blue-600 hover:text-blue-800"
                onClick={() => handleAdminSelect(null)}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {categoryFilter !== 'all' && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full flex items-center">
              <Tag className="h-3 w-3 mr-1" />
              Category: {categoryFilter}
              <button
                className="ml-1 text-purple-600 hover:text-purple-800"
                onClick={() => setCategoryFilter('all')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {stockFilter !== 'all' && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
              <Package className="h-3 w-3 mr-1" />
              Stock: {stockFilter === 'inStock' ? 'In Stock' : stockFilter === 'lowStock' ? 'Low Stock' : 'Out of Stock'}
              <button
                className="ml-1 text-green-600 hover:text-green-800"
                onClick={() => setStockFilter('all')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {searchTerm && (
            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full flex items-center">
              <Search className="h-3 w-3 mr-1" />
              Search: {searchTerm}
              <button
                className="ml-1 text-gray-600 hover:text-gray-800"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          <button
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:underline"
            onClick={() => {
              setCategoryFilter('all');
              setStockFilter('all');
              setSearchTerm('');
              handleAdminSelect(null);
            }}
          >
            Clear All
          </button>
        </motion.div>
      )}
      
      {/* Products Grid */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : filteredProductsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProductsList.map(product => (
              <motion.div
                key={product._id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Featured Badges */}
                  <div className="absolute top-2 left-2 flex flex-col space-y-1">
                    {product.isBestseller && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Bestseller
                      </span>
                    )}
                    {product.isNewArrival && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        New Arrival
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {product.title}
                    </h3>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">
                      {product.category || 'Uncategorized'}
                    </span>
                    {getStockBadge(product.totalStock)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <User className="h-4 w-4 mr-1 text-gray-400" />
                    <span>
                      Admin: {product.createdBy?.userName || 'Unknown'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => toggleProductExpansion(product._id)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {expandedProducts[product._id] ? 'Hide Details' : 'View Details'}
                  </button>
                  
                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedProducts[product._id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-gray-200 overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                              Product ID
                            </h4>
                            <p className="text-sm text-gray-700">
                              {product._id}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                              Full Description
                            </h4>
                            <p className="text-sm text-gray-700">
                              {product.description || 'No description available'}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                                Price
                              </h4>
                              <p className="text-sm text-gray-700 flex items-center">
                                <DollarSign className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                                Stock
                              </h4>
                              <p className="text-sm text-gray-700 flex items-center">
                                <Package className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                {product.stock} units
                              </p>
                            </div>
                          </div>
                          
                          {product.images && product.images.length > 1 && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                                Additional Images
                              </h4>
                              <div className="flex space-x-2 overflow-x-auto pb-2">
                                {product.images.slice(1).map((image, idx) => (
                                  <img 
                                    key={idx}
                                    src={image} 
                                    alt={`${product.title} - Image ${idx + 2}`}
                                    className="h-16 w-16 object-cover rounded-md flex-shrink-0"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
            <Package className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-lg font-medium text-gray-500">No products found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all' || selectedAdmin
                ? 'Try adjusting your filters to see more results'
                : 'Products will appear here once they are added'}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SuperAdminProducts;
