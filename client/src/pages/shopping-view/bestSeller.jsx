import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBestsellerProducts } from '../../store/shop/product-slice/index';
import { addToCart, fetchCartItems } from '../../store/shop/cart-slice';
import { addToWishlist, removeFromWishlist } from '../../store/shop/wishlist-slice';
import RenderImage from '../../components/common/renderImage';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ShoppingLoader from '../../components/common/ShoppingLoader';
import { ShoppingBag, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductOptionsModal from '../../components/shopping-view/productOptionsModal';

const BestSeller = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  const { bestsellerProducts, bestsellerLoading: loading } = useSelector((state) => state.shopProducts);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { wishlistItems } = useSelector(state => state.wishlist);
  const { user } = useSelector((state) => state.auth);
  
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    dispatch(fetchBestsellerProducts());
  }, [dispatch]);

  // Scroll function for carousel
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Width of one card plus gap
      const newScrollPosition = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleOpenDialog = (productId) => {
    navigate(`/shop/product/${productId}`);
  };

  const handleAddToCart = (productId) => {
    if (!user) {
      toast.error("Please login to add items to your cart");
      return;
    }
    
    const product = bestsellerProducts?.find(p => p._id === productId);
    
    if (product) {
      setSelectedProduct(product);
      setIsOptionsModalOpen(true);
    } else {
      toast.error("Product not found");
    }
  };

  const handleToggleWishlist = (productId) => {
    let wishlistParams = {};
    
    if (user && (user._id || user.id)) {
      wishlistParams.userId = user._id || user.id;
    } else {
      let guestId = localStorage.getItem('guestId');
      if (!guestId) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestId', guestId);
      }
      wishlistParams.guestId = guestId;
    }
    
    const isInWishlist = wishlistItems?.some(item => item.productId === productId);
    
    if (isInWishlist) {
      dispatch(removeFromWishlist({ ...wishlistParams, productId }));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addToWishlist({ ...wishlistParams, productId }));
      toast.success("Added to wishlist");
    }
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg">No bestseller products available at the moment.</p>
      <p className="text-gray-400 mt-2">Check back soon for our top picks!</p>
    </div>
  );

  if (loading) {
    return (
      <section className="py-12 sm:py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Best Sellers</h2>
          </div>
          <div className="flex items-center justify-center min-h-[400px] w-full">
            <ShoppingLoader />
          </div>
        </div>
      </section>
    );
  }

  if (!bestsellerProducts || bestsellerProducts.length === 0) {
    return (
      <section className="py-12 sm:py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          {renderEmptyState()}
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="inline-block text-sm font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-2">Trending Now</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Best Sellers</h2>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 sm:p-2 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 sm:p-2 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Products Carousel */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {bestsellerProducts.map((product, index) => {
            const isInWishlist = wishlistItems?.some(item => item.productId === product._id);
            
            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0"
              >
                <div className="w-[280px] cursor-pointer group" onClick={() => handleOpenDialog(product._id)}>
                  {/* Product Image */}
                  <div className="relative w-full aspect-square mb-3 overflow-hidden bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <RenderImage 
                      src={product.image} 
                      alt={product.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Bestseller Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        Bestseller
                      </span>
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(product._id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
                    >
                      <Heart className={`w-4 h-4 transition-colors duration-200 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    </button>

                    {/* Transparent Hover overlay with quick actions */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(product._id);
                          }}
                          className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-white transition-colors text-sm"
                        >
                          Quick View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product._id);
                          }}
                          className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Product Information - Product tile style */}
                  <div className="space-y-1">
                    {/* Category - small and subtle */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {product.category}
                    </p>

                    {/* Product Title */}
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
                      {product.title}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        GHS {product.price.toFixed(2)}
                      </span>
                      {product.salePrice && product.salePrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          GHS {product.salePrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Products Button - Moved to left */}
        <div className="flex justify-start mt-8">
          <button 
            onClick={() => navigate('/shop/listing')}
            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            View All Products
          </button>
        </div>
      </div>

      {/* Product Options Modal */}
      <ProductOptionsModal 
        isOpen={isOptionsModalOpen} 
        onClose={() => setIsOptionsModalOpen(false)} 
        product={selectedProduct}
        onAddToCart={() => {
          setIsOptionsModalOpen(false);
          dispatch(fetchCartItems(user?._id || user?.id));
        }}
      />
    </section>
  );
};

export default BestSeller;
