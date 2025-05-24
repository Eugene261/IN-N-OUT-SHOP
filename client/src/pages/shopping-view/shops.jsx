import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Star, MapPin, Store, Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function ShopsDirectory() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const navigate = useNavigate();

  const categories = [
    'all',
    'Electronics',
    'Fashion', 
    'Home & Garden',
    'Sports',
    'Beauty',
    'Other'
  ];

  // Custom button styles
  const buttonStyles = {
    base: "px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    small: "px-3 py-1 text-sm",
    full: "w-full",
    disabled: "opacity-50 cursor-not-allowed"
  };

    useEffect(() => {    fetchShops();  }, [selectedCategory, searchTerm, currentPage]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '12');
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const url = `/api/admin/shop/all?${params.toString()}`;
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setShops(data.shops || []);
        setPagination(data.pagination || {});
      } else {
        console.error('API returned success: false', data);
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
      setShops([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handleShopClick = (shopId) => {
    console.log('🏪 Shop clicked:', shopId);
    navigate(`/shop/vendor/${shopId}`);
  };

  const handleViewProducts = (shopName) => {
    console.log('👀 View Products clicked for:', shopName);
    navigate(`/shop/listing?shop=${encodeURIComponent(shopName)}`);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    console.log('🔍 Search changed to:', value);
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    console.log('🏷️ Category change clicked:', category);
    console.log('🏷️ Previous category:', selectedCategory);
    
    // Force a state update with explicit logging
    setSelectedCategory(prevCategory => {
      console.log('🏷️ Setting category from', prevCategory, 'to', category);
      return category;
    });
    
    setCurrentPage(1);
    
    // Extra debug
    setTimeout(() => {
      console.log('🏷️ Category after timeout:', selectedCategory);
    }, 100);
  };

  // Force refresh button for testing
  const handleForceRefresh = () => {
    console.log('🔄 Force refresh triggered');
    fetchShops();
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
              onClick={(e) => {
                e.preventDefault();
                console.log('🎯 Button clicked for category:', category);
                handleCategoryChange(category);
              }}
              onMouseDown={(e) => {
                console.log('🖱️ Mouse down on category:', category);
              }}
              className={`${buttonStyles.base} ${buttonStyles.small} ${
                selectedCategory === category ? buttonStyles.primary : buttonStyles.outline
              } ${selectedCategory === category ? 'ring-2 ring-purple-500' : ''}`}
              style={{ 
                backgroundColor: selectedCategory === category ? '#7c3aed' : 'white',
                color: selectedCategory === category ? 'white' : '#374151'
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
              {selectedCategory === category && ' ✓'}
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
                      className={`${buttonStyles.base} ${buttonStyles.full} ${buttonStyles.primary}`}
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
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className={`${buttonStyles.base} ${buttonStyles.outline} ${
                  !pagination.hasPrev ? buttonStyles.disabled : ''
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`${buttonStyles.base} ${buttonStyles.small} ${
                        currentPage === pageNum ? buttonStyles.primary : buttonStyles.outline
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`${buttonStyles.base} ${buttonStyles.outline} ${
                  !pagination.hasNext ? buttonStyles.disabled : ''
                }`}
              >
                Next
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
            className={`${buttonStyles.base} ${buttonStyles.primary}`}
          >
            Clear Filters
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default ShopsDirectory; 