import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Store, MapPin, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { fetchAllShops } from '@/store/shop/product-slice';
import { useNavigate } from 'react-router-dom';

const ShopsSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  const { allShops, shopsLoading } = useSelector(state => state.shopProducts);

  useEffect(() => {
    dispatch(fetchAllShops({ limit: 10 }));
  }, [dispatch]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newScrollPosition = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleShopClick = (shopId) => {
    navigate(`/shop/listing?shop=${shopId}`);
  };

  if (shopsLoading) {
    return (
      <section className="py-12 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Current Shops
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Explore our trusted vendors</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!allShops || allShops.length === 0) {
    return null;
  }

  return (
    <motion.section 
      className="py-12 bg-white dark:bg-gray-900 transition-colors duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Current Shops
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Explore our trusted vendors</p>
          </div>
          
          {/* Navigation Buttons */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Shops Carousel */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allShops.map((shop, index) => (
            <motion.div
              key={shop._id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0"
            >
              <Card 
                className="w-[240px] cursor-pointer group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                onClick={() => handleShopClick(shop._id)}
              >
                <CardContent className="p-3">
                  {/* Shop Logo/Banner - Reduced Height */}
                  <div className="relative mb-3 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
                    {shop.shopBanner ? (
                      <img 
                        src={shop.shopBanner} 
                        alt={shop.shopName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                    )}
                    
                    {/* Shop Logo Overlay - Smaller */}
                    {shop.shopLogo && (
                      <div className="absolute -bottom-2 left-3 w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden bg-white">
                        <img 
                          src={shop.shopLogo} 
                          alt={shop.shopName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Shop Info - More Compact */}
                  <div className="mt-3">
                    <h3 className="font-semibold text-base text-gray-800 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {shop.shopName}
                    </h3>
                    
                    {shop.shopCategory && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {shop.shopCategory}
                      </p>
                    )}
                    
                    {/* Rating - More Compact */}
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {shop.shopRating ? shop.shopRating.toFixed(1) : '5.0'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({shop.shopReviewCount || 0})
                      </span>
                    </div>

                    {/* Location & Products - More Compact */}
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{shop.baseCity || 'Ghana'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{shop.productCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View All Shops Button */}
        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/shops')}
            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            View All Shops
          </button>
        </div>
      </div>
    </motion.section>
  );
};

export default ShopsSection; 