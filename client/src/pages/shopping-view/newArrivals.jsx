// NewArrivals.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchNewArrivalProducts } from '../../store/shop/product-slice/index';
import { addToWishlist, removeFromWishlist, fetchWishlistItems } from '../../store/shop/wishlist-slice/index';
import { addToCart, fetchCartItems } from '../../store/shop/cart-slice';
import RenderImage from '../../components/common/renderImage';
import { ChevronLeftIcon, ChevronRightIcon, Heart, ShoppingBag } from 'lucide-react';
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

    // Fetch wishlist items if user is logged in
    if (user && user._id) {
      dispatch(fetchWishlistItems(user._id));
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
    
    if (!user) {
      toast.info("Please login to add items to your wishlist", {
        description: "You'll be redirected to the login page",
        duration: 3000
      });
      // Set a timeout to allow the toast to be shown before redirecting
      setTimeout(() => {
        // Store the current page URL in sessionStorage to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/auth/login');
      }, 1500);
      return;
    }
    
    // Ensure user ID is available
    const userId = user?.id || user?._id;
    if (!userId) {
      console.error("User is authenticated but ID is missing:", user);
      toast.error("User information is incomplete. Please try logging in again.");
      return;
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
      dispatch(removeFromWishlist({ userId, productId }))
        .then(() => {
          toast.success("Removed from wishlist");
        })
        .catch((error) => {
          console.error("Error removing from wishlist:", error);
          toast.error("Failed to remove from wishlist");
        });
    } else {
      dispatch(addToWishlist({ userId, productId }))
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
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl text-center font-bold mb-8"
        >
          New Arrivals
        </motion.h2>
        
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
                className="flex overflow-x-auto pb-6 hide-scrollbar"
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
                      className="flex-shrink-0 w-64 mx-2 first:ml-0 last:mr-0 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      variants={itemVariants}
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="relative h-64 overflow-hidden">
                        <RenderImage 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                        <button 
                          className={`absolute top-2 right-2 p-2 rounded-full ${isInWishlist ? 'bg-red-50' : 'bg-white'}`}
                          onClick={(e) => handleToggleWishlist(e, product)}
                        >
                          <Heart 
                            className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                          />
                        </button>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-1 truncate">{product.name}</h3>
                        <p className="text-gray-500 text-sm mb-2 truncate">{product.brand}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">GHS {product.price.toFixed(2)}</span>
                          <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            New
                          </div>
                        </div>
                        <button
                          className="mt-3 w-full bg-black text-white py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Add to Cart
                        </button>
                      </div>
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
