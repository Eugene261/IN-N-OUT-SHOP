import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchWishlistItems, removeFromWishlist } from '@/store/shop/wishlist-slice';
import { addToCart, fetchCartItems } from '@/store/shop/cart-slice';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import ShoppingLoader from '@/components/common/ShoppingLoader';
import ProductOptionsModal from '@/components/shopping-view/productOptionsModal';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { wishlistItems, isLoading } = useSelector(state => state.wishlist);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (user) {
      // Handle both user.id and user._id formats to ensure compatibility
      const userId = user.id || user._id;
      if (userId) {
        console.log("Fetching wishlist for user ID:", userId);
        // Add a small delay to ensure authentication is fully processed
        const timer = setTimeout(() => {
          dispatch(fetchWishlistItems(userId));
        }, 300);
        
        return () => clearTimeout(timer);
      } else {
        console.error("User object exists but no ID found:", user);
      }
    }
  }, [dispatch, user]);

  const handleRemoveFromWishlist = (productId) => {
    if (!user) return;
    
    // Handle both user.id and user._id formats to ensure compatibility
    const userId = user.id || user._id;
    if (!userId) {
      console.error("User object exists but no ID found:", user);
      toast.error('User information is incomplete');
      return;
    }
    
    dispatch(removeFromWishlist({ userId, productId }))
      .unwrap()
      .then((result) => {
        console.log("Removed from wishlist result:", result);
        toast.success('Removed from wishlist');
        // Refresh the wishlist to ensure UI is updated
        dispatch(fetchWishlistItems(userId));
      })
      .catch((error) => {
        console.error("Error removing from wishlist:", error);
        toast.error(error.message || 'Failed to remove from wishlist');
      });
  };

  const navigate = useNavigate();

  const handleViewProductDetails = (product) => {
    // Navigate to the product details page
    if (product._id) {
      navigate(`/shop/product/${product._id}`);
    } else if (product.productId && typeof product.productId === 'string') {
      navigate(`/shop/product/${product.productId}`);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ShoppingLoader />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-gray-500 uppercase tracking-wider text-sm font-medium mb-2"
        >
          Your Favorites
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600"
        >
          My Wishlist
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-1 w-24 bg-gradient-to-r from-gray-900 to-gray-500 mx-auto rounded-full mb-6"
        ></motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-gray-600 max-w-2xl mx-auto"
        >
          Items you've saved to your wishlist. You can add them to your cart or remove them at any time.
        </motion.p>
      </div>


      {wishlistItems && wishlistItems.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {wishlistItems.map((item, index) => {
            // Extract product information based on different possible data structures
            const productId = item.productId || item._id;
            const image = item.image || item.product?.image;
            const title = item.title || item.product?.title || `Product ${index + 1}`;
            const description = item.description || item.product?.description || 'No description available';
            
            console.log(`Rendering wishlist item ${index}:`, { productId, image, title });
            
            return (
              <motion.div
                key={productId || index}
                variants={itemVariants}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  {image ? (
                    <img 
                      src={image} 
                      alt={title} 
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">No image available</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveFromWishlist(productId)}
                    className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {item.brand || item.product?.brand || 'Brand'}
                  </p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-medium text-gray-900">
                      GHS {(item.price || item.product?.price || 0).toFixed(2)}
                    </p>
                    {(item.salePrice || item.product?.salePrice) > 0 && (
                      <p className="text-sm text-red-500">
                        Sale: GHS {(item.salePrice || item.product?.salePrice).toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => {
                        // Format the product data properly for the modal
                        const formattedProduct = {
                          _id: item.productId || item._id,
                          name: item.title || item.product?.title || `Product`,
                          image: item.image || item.product?.image,
                          price: item.price || item.product?.price || 0,
                          brand: item.brand || item.product?.brand || 'Brand',
                          description: item.description || item.product?.description || 'No description available'
                        };
                        
                        // Open the product options modal with formatted product data
                        setSelectedProduct(formattedProduct);
                        setIsOptionsModalOpen(true);
                      }}
                      className="flex-1 py-2.5 px-4 bg-black text-white rounded-lg text-sm font-medium 
                      hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-medium text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Start adding items to your wishlist by clicking the heart icon on products</p>
          <Link to="/shop/products">
            <motion.button
              className="py-2.5 px-6 bg-black text-white rounded-lg text-sm font-medium 
              hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore Products
            </motion.button>
          </Link>
        </motion.div>
      )}

      {/* Product Options Modal */}
      <ProductOptionsModal 
        isOpen={isOptionsModalOpen} 
        onClose={() => setIsOptionsModalOpen(false)} 
        product={selectedProduct}
        onAddToCart={() => {
          setIsOptionsModalOpen(false);
          if (user) {
            dispatch(fetchCartItems(user?._id || user?.id));
          }
        }}
      />
    </div>
  );
};

export default WishlistPage;
