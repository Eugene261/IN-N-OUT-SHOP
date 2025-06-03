import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Star, MapPin, Store, Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../../config/api.js';

function ShopsDirectory() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();

  const buttonStyles = {
    base: 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200',
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-black',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    small: 'text-sm px-3 py-1.5',
    full: 'w-full',
    disabled: 'opacity-50 cursor-not-allowed',
  };

  const categories = [
    'all',
    'Electronics',
    'Fashion', 
    'Home & Garden',
    'Sports',
    'Beauty',
    'Other'
  ];

  useEffect(() => {
    fetchShops();
  }, [selectedCategory, searchTerm, currentPage]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '12');
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await apiClient.get(`/api/admin/shop/all?${params.toString()}`);
      
      if (response.data.success) {
        setShops(response.data.shops);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopClick = (shopId) => {
    navigate(`/shop/vendor/${shopId}`);
  };

  const handleViewProducts = (shopName) => {
    navigate(`/shop/listing?shop=${encodeURIComponent(shopName)}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when filtering
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div 
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Shop Directory
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Discover amazing vendors and their unique products
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div 
        className="mb-8 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search shops..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        
        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap justify-center">
          {categories.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`${buttonStyles.base} ${selectedCategory === category ? buttonStyles.primary : buttonStyles.outline} ${buttonStyles.small}`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading shops...</p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          {pagination.totalShops > 0 && (
            <motion.div 
              className="mb-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-600 dark:text-gray-400">
                Showing {shops.length} of {pagination.totalShops} shops
              </p>
            </motion.div>
          )}

          {/* Shops Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {shops.map((shop, index) => (
              <motion.div
                key={shop._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div onClick={() => handleShopClick(shop._id)}>
                    {/* Shop Banner */}
                    {shop.shopBanner && (
                      <div className="h-32 overflow-hidden rounded-t-lg">
                        <img
                          src={shop.shopBanner}
                          alt={shop.shopName}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      {/* Shop Logo & Name */}
                      <div className="flex items-center gap-3 mb-4">
                        {shop.shopLogo ? (
                          <img
                            src={shop.shopLogo}
                            alt={shop.shopName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <Store className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate">{shop.shopName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {shop.shopCategory}
                          </Badge>
                        </div>
                      </div>

                      {/* Shop Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                        {shop.shopDescription || 'Welcome to our shop! We offer high-quality products with excellent service.'}
                      </p>

                      {/* Shop Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{shop.productCount} products</span>
                        </div>
                        {shop.shopRating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{shop.shopRating}</span>
                            <span className="text-gray-400">({shop.shopReviewCount})</span>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      {(shop.baseCity || shop.baseRegion) && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                          <MapPin className="w-4 h-4" />
                          <span>{shop.baseCity}{shop.baseCity && shop.baseRegion && ', '}{shop.baseRegion}</span>
                        </div>
                      )}
                    </CardContent>
                  </div>
                  
                  {/* Action Button */}
                  <div className="px-6 pb-6">
                    <button
                      type="button"
                      className={`${buttonStyles.base} ${buttonStyles.primary} ${buttonStyles.full}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProducts(shop.shopName);
                      }}
                    >
                      View Products
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <motion.div 
              className="mt-8 flex justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={`${buttonStyles.base} ${buttonStyles.outline}`}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              )}
              {[...Array(pagination.totalPages).keys()].map(num => (
                <button
                  key={num + 1}
                  type="button"
                  onClick={() => setCurrentPage(num + 1)}
                  className={`${buttonStyles.base} ${currentPage === num + 1 ? buttonStyles.primary : buttonStyles.outline}`}
                >
                  {num + 1}
                </button>
              ))}
              {currentPage < pagination.totalPages && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  className={`${buttonStyles.base} ${buttonStyles.outline}`}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </button>
              )}
            </motion.div>
          )}

          {/* Clear Filters Button - Example of an additional button */}
          {(selectedCategory !== 'all' || searchTerm) && (
             <motion.div 
              className="mt-8 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className={`${buttonStyles.base} ${buttonStyles.outline}`}
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && shops.length === 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No shops found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          <button 
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
            className={`${buttonStyles.base} ${buttonStyles.outline}`}
          >
            Clear Filters
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default ShopsDirectory; 