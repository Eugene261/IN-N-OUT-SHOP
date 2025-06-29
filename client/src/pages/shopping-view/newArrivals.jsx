// NewArrivals.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchNewArrivalProducts } from '../../store/shop/product-slice/index';
import { addToWishlist, removeFromWishlist, fetchWishlistItems } from '../../store/shop/wishlist-slice/index';
import { addToCart, fetchCartItems } from '../../store/shop/cart-slice';
import EnhancedShoppingProductTile from '../../components/shopping-view/enhanced-product-tile';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ShoppingLoader from '../../components/common/ShoppingLoader';
import ProductOptionsModal from '../../components/shopping-view/productOptionsModal';

const NewArrivals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { newArrivalProducts, newArrivalLoading: loading } = useSelector((state) => state.shopProducts);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    try {
      console.log('Attempting to fetch new arrivals...');
      
      dispatch(fetchNewArrivalProducts())
        .unwrap()
        .then((result) => {
          console.log('New arrivals fetch success:', result);
        })
        .catch((error) => {
          console.error('New arrivals fetch error in component:', error);
        });
    } catch (error) {
      console.error("Error dispatching fetchNewArrivalProducts:", error);
    }

    // Fetch wishlist items for both authenticated and guest users
    if (user && user._id) {
      dispatch(fetchWishlistItems({ userId: user._id }));
    } else {
      // Guest user - fetch guest wishlist
      const guestId = localStorage.getItem('guestId');
      if (guestId) {
        dispatch(fetchWishlistItems({ guestId }));
      }
    }
  }, [dispatch, user]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftButton(scrollLeft > 0);
        setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [newArrivalProducts]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleProductClick = (product) => {
    // Validate product and product ID before navigation
    if (!product || !product._id) {
      console.error('Product or product ID is missing:', product);
      return;
    }
    // Navigate to product details page
    navigate(`/shop/product/${product._id}`);
  };
  
  const handleAddToCart = (product) => {
    if (!user) {
      toast.error("Please login to add items to your cart");
      return;
    }
    
    // Open the options modal with the selected product
    setSelectedProduct(product);
    setIsOptionsModalOpen(true);
  };

  const handleToggleWishlist = (e, product) => {
    e.stopPropagation();
    
    let wishlistParams = {};
    
    if (user && (user._id || user.id)) {
      // Authenticated user
      wishlistParams.userId = user._id || user.id;
    } else {
      // Guest user - get or create guest ID
      let guestId = localStorage.getItem('guestId');
      if (!guestId) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestId', guestId);
      }
      wishlistParams.guestId = guestId;
    }
    
    const productId = product._id;
    
    if (!productId) {
      toast.error("Product information is missing");
      return;
    }
    
    const isInWishlist = wishlistItems?.some(item => 
      item.productId === productId || 
      item.productId?._id === productId
    );
    
    if (isInWishlist) {
      dispatch(removeFromWishlist({ ...wishlistParams, productId }))
        .then(() => {
          toast.success("Removed from wishlist");
        })
        .catch((error) => {
          console.error("Error removing from wishlist:", error);
          toast.error("Failed to remove from wishlist");
        });
    } else {
      dispatch(addToWishlist({ ...wishlistParams, productId }))
        .then(() => {
          toast.success("Added to wishlist");
        })
        .catch((error) => {
          console.error("Error adding to wishlist:", error);
          toast.error("Failed to add to wishlist");
        });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm uppercase tracking-widest text-gray-500 mb-2 block">Fresh Collection</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 inline-block">
            New Arrivals
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-black to-gray-400 rounded-full mt-4 mx-auto"></div>
        </motion.div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px] w-full">
            <ShoppingLoader />
          </div>
        ) : newArrivalProducts && newArrivalProducts.length > 0 ? (
            <div className="relative">
              {/* Scroll buttons */}
              <AnimatePresence>
                {showLeftButton && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md"
                    onClick={scrollLeft}
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </motion.button>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {showRightButton && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md"
                    onClick={scrollRight}
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </motion.button>
                )}
              </AnimatePresence>
              
              {/* Product cards */}
              <motion.div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto pb-6 hide-scrollbar gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {newArrivalProducts.map((product) => {
                  const isInWishlist = wishlistItems?.some(item => 
                    item.productId === product._id || 
                    item.productId?._id === product._id
                  );
                  
                  return (
                    <motion.div
                      key={product._id}
                      className="flex-shrink-0 w-72"
                      variants={itemVariants}
                    >
                      <EnhancedShoppingProductTile
                        product={product}
                        handleGetProductDetails={() => handleProductClick(product)}
                        handleAddToCart={() => handleAddToCart(product)}
                        handleAddToWishlist={(productId) => handleToggleWishlist({ stopPropagation: () => {} }, product)}
                        isInWishlist={isInWishlist}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No new arrivals available at the moment.</p>
            </div>
          )}
        

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

export default NewArrivals;

// CSS for hiding scrollbars
const styles = `
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
