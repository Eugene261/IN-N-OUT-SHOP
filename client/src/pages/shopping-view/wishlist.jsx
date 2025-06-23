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
import EnhancedShoppingProductTile from '@/components/shopping-view/enhanced-product-tile';

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
          dispatch(fetchWishlistItems({ userId }));
        }, 300);
        
        return () => clearTimeout(timer);
      } else {
        console.error("User object exists but no ID found:", user);
      }
    } else {
      // Guest user - fetch guest wishlist
      const guestId = localStorage.getItem('guestId');
      if (guestId) {
        console.log("Fetching wishlist for guest ID:", guestId);
        dispatch(fetchWishlistItems({ guestId }));
      } else {
        // Generate a new guest ID and fetch empty wishlist
        const newGuestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestId', newGuestId);
        console.log("Generated new guest ID:", newGuestId);
        dispatch(fetchWishlistItems({ guestId: newGuestId }));
      }
    }
  }, [dispatch, user]);

  const handleRemoveFromWishlist = (productId) => {
    let removeParams = {};
    
    if (user) {
      // Authenticated user
      const userId = user.id || user._id;
      if (!userId) {
        console.error("User object exists but no ID found:", user);
        toast.error('User information is incomplete');
        return;
      }
      removeParams = { userId, productId };
    } else {
      // Guest user
      const guestId = localStorage.getItem('guestId');
      if (!guestId) {
        toast.error('Unable to remove from wishlist');
        return;
      }
      removeParams = { guestId, productId };
    }
    
    dispatch(removeFromWishlist(removeParams))
      .unwrap()
      .then((result) => {
        console.log("Removed from wishlist result:", result);
        toast.success('Removed from wishlist');
        // No need to fetch again - the slice already updates the state
      })
      .catch((error) => {
        console.error("Error removing from wishlist:", error);
        toast.error(error.message || 'Failed to remove from wishlist');
      });
  };

  const navigate = useNavigate();

  const handleViewProductDetails = (productId) => {
    // Navigate to the product details page
    console.log('Navigating to product:', productId);
    if (productId) {
      navigate(`/shop/product/${productId}`);
    } else {
      console.error('No product ID provided for navigation');
      toast.error('Unable to view product details');
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
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
        >
          {wishlistItems.map((item, index) => {
            // Extract product information based on different possible data structures
            const productId = item.productId?._id || item.productId || item._id;
            const productData = item.productId || item.product || item;
            
            const product = {
              _id: productId,
              title: productData.title || `Product ${index + 1}`,
              image: productData.image,
              price: productData.price || 0,
              salePrice: productData.salePrice || 0,
              brand: productData.brand || 'Brand',
              category: productData.category || 'Category',
              totalStock: productData.totalStock || 0,
              description: productData.description || 'No description available',
              colors: productData.colors || [],
              sizes: productData.sizes || [],
              createdBy: productData.createdBy
            };
            
            console.log(`Rendering wishlist item ${index}:`, { productId, product });
            
            return (
              <motion.div
                key={productId || index}
                variants={itemVariants}
              >
                <EnhancedShoppingProductTile 
                  product={product}
                  handleGetProductDetails={handleViewProductDetails}
                  handleAddToCart={() => {
                    // Format the product data properly for the modal
                    const formattedProduct = {
                      _id: productId,
                      title: product.title,
                      name: product.title,
                      image: product.image,
                      price: product.price,
                      salePrice: product.salePrice,
                      brand: product.brand,
                      category: product.category,
                      totalStock: product.totalStock,
                      description: product.description
                    };
                    
                    // Open the product options modal with formatted product data
                    setSelectedProduct(formattedProduct);
                    setIsOptionsModalOpen(true);
                  }}
                  handleAddToWishlist={(id) => handleRemoveFromWishlist(id || productId)}
                  isInWishlist={true}
                />
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
          <Link to="/shop/listing">
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
