import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Store } from 'lucide-react';
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
      const scrollAmount = 340; // Width of one card plus gap
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
              Shops
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
              Shops
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
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
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
              <div 
                className="w-[320px] cursor-pointer group" 
                onClick={() => handleShopClick(shop._id)}
              >
                {/* Shop Image/Banner - Reduced height */}
                <div className="relative w-full h-24 mb-3 overflow-hidden bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {shop.shopBanner ? (
                    <img
                      src={shop.shopBanner}
                      alt={shop.shopName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <Store className="w-8 h-8 text-white" />
                    </div>
                  )}
                  
                  {/* Shop Logo Overlay */}
                  {shop.shopLogo && (
                    <div className="absolute bottom-3 left-3 w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-white shadow-lg">
                      <img 
                        src={shop.shopLogo} 
                        alt={shop.shopName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Shop Information - Product tile style */}
                <div className="space-y-1">
                  {/* Shop Category - small and subtle */}
                  {shop.shopCategory && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {shop.shopCategory}
                    </p>
                  )}

                  {/* Shop Name */}
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {shop.shopName}
                  </h3>

                  {/* Rating and Reviews */}
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {shop.shopRating ? shop.shopRating.toFixed(1) : '5.0'} ({shop.shopReviewCount || 0})
                    </span>
                  </div>

                  {/* Product Count */}
                  <div className="pt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {shop.productCount || 0} Products
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Shops Button */}
        <div className="flex justify-start mt-8">
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