import React, { useEffect } from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye, Heart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist, fetchWishlistItems } from '@/store/shop/wishlist-slice';
import { toast } from 'sonner';
import { brandOptionsMap, categoryOptionsMap } from '@/config';
import { useNavigate } from 'react-router-dom';
import LazyImage from '../common/LazyImage';
import { fetchAllTaxonomyData } from '@/store/superAdmin/taxonomy-slice';

function ShoppingProductTile({ product, handleAddToCart, onAddToCart }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { wishlistItems } = useSelector(state => state.wishlist);
  const { brands, categories } = useSelector(state => state.taxonomy);
  
  // Fetch taxonomy data on component mount
  useEffect(() => {
    if (!brands || brands.length === 0) {
      dispatch(fetchAllTaxonomyData());
    }
  }, [dispatch, brands]);
  
  // Utility function to convert database IDs to human-readable names
  const convertIdToName = (id, taxonomyArray, fallbackMap = {}) => {
    if (!id) return '';
    
    // If it's already a human-readable name (not a MongoDB ObjectId), return as is
    if (typeof id === 'string' && id.length !== 24) {
      return fallbackMap[id] || id;
    }
    
    // Find the taxonomy item by ID
    const item = taxonomyArray?.find(item => item._id === id);
    return item ? item.name : (fallbackMap[id] || id);
  };

  // Get display names for brand and category
  const displayBrand = convertIdToName(product?.brand, brands, brandOptionsMap);
  const displayCategory = convertIdToName(product?.category, categories, categoryOptionsMap);
  
  // Check if product is in wishlist
  const isInWishlist = wishlistItems?.some(item => 
    item.productId === product?._id || 
    item.productId?._id === product?._id
  );
  
  // Handle toggling wishlist
  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.info("Please login to add items to your wishlist", {
        description: "You'll be redirected to the login page",
        duration: 3000
      });
      // Set a timeout to allow the toast to be shown before redirecting
      setTimeout(() => {
        // Store the current URL in sessionStorage to redirect back after login
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
    
    if (!product || !product._id) {
      toast.error("Product information is missing");
      return;
    }
    
    // Check if the product is already in the wishlist to prevent duplicate entries
    if (isInWishlist) {
      // If already in wishlist, remove it
      dispatch(removeFromWishlist({ userId, productId: product._id }))
        .unwrap()
        .then((result) => {
          console.log("Successfully removed from wishlist:", result);
          toast.success("Removed from wishlist");
          // Refresh wishlist items
          dispatch(fetchWishlistItems(userId));
        })
        .catch((error) => {
          console.error("Failed to remove from wishlist:", error);
          toast.error(error.message || "Failed to remove from wishlist");
        });
    } else {
      // If not in wishlist, add it
      dispatch(addToWishlist({ userId, productId: product._id }))
        .unwrap()
        .then((result) => {
          console.log("Successfully added to wishlist:", result);
          toast.success("Added to wishlist");
          // Refresh wishlist items
          dispatch(fetchWishlistItems(userId));
        })
        .catch((error) => {
          console.error("Failed to add to wishlist:", error);
          // Check if the error is because the item is already in the wishlist
          if (error && error.message && error.message.includes("already in wishlist")) {
            toast.info("This item is already in your wishlist");
          } else {
            toast.error(error.message || "Failed to add to wishlist");
          }
        });
    }
  };
  
  // Handler for the Add to Cart button click
  const handleAddToCartClick = (e, productId, totalStock) => {
    // Stop event propagation to prevent the card click handler from firing
    e.stopPropagation();
    // Use either handleAddToCart or onAddToCart, depending on which one is provided
    if (typeof handleAddToCart === 'function') {
      handleAddToCart(productId, totalStock);
    } else if (typeof onAddToCart === 'function') {
      onAddToCart(productId, totalStock);
    } else {
      console.warn('No add to cart handler provided for product:', product.title);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Card 
        className="w-full max-w-sm mx-auto overflow-hidden rounded-xl
        border-none shadow-lg hover:shadow-xl transition-all duration-300 
        flex flex-col h-full cursor-pointer bg-white"
        onClick={() => navigate(`/shop/product/${product?._id}`)}
      >
        {/* Image container */}
        <div className="relative w-full overflow-hidden">
          <div className="aspect-square overflow-hidden bg-gray-50">
            <LazyImage
              src={product?.image}
              alt={product?.title || 'Product image'}
              className="w-full h-full object-cover object-center transition-transform duration-500 md:group-hover:scale-110"
              fallbackSrc="/placeholder-product.svg"
            />
          </div>

          {/* Add to Cart Button (visible on hover on medium and larger screens) */}
          <div className="absolute inset-0 bg-black bg-opacity-0 md:group-hover:bg-opacity-20 transition-all duration-300 hidden md:flex items-center justify-center opacity-0 md:group-hover:opacity-100">
            {product?.totalStock > 0 && (
              <motion.button
                onClick={(e) => handleAddToCartClick(e, product?._id, product?.totalStock)}
                className="py-2.5 px-4 rounded-lg bg-black text-white
                font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </motion.button>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product?.salePrice > 0 && (
              <Badge className="bg-red-500 text-white px-2 py-1 text-xs font-medium rounded-md">
                SALE
              </Badge>
            )}
            
            {product?.totalStock === 0 && (
              <Badge className="bg-gray-800 text-white px-2 py-1 text-xs font-medium rounded-md">
                OUT OF STOCK
              </Badge>
            )}
            
            {product?.totalStock > 0 && product?.totalStock <= 5 && (
              <Badge className="bg-amber-500 text-white px-2 py-1 text-xs font-medium rounded-md">
                ONLY {product.totalStock} LEFT
              </Badge>
            )}
          </div>
          
          {/* Wishlist button - visible for all users */}
          <motion.button
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm
            flex items-center justify-center shadow-md z-10"
            onClick={handleToggleWishlist}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart 
              className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
            />
          </motion.button>
        </div>
        
        {/* Product details */}
        <CardContent className="p-4 flex-grow">
          {/* Brand and category */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              {displayBrand}
            </span>
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              {displayCategory}
            </span>
          </div>
          
          {/* Product title */}
          <h2 className="text-base font-semibold mb-3 text-gray-900 line-clamp-2 min-h-[2.5rem]">
            {product?.title}
          </h2>
          
          {/* Price display */}
          <div className="flex items-center gap-2">
            {product?.salePrice > 0 ? (
              <>
                <span className="text-lg font-bold text-black">
                  GHS {product?.price?.toFixed(2)}
                </span>
                <span className="line-through text-gray-400 text-sm">
                  GHS {product?.salePrice?.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-black">
                GHS {product?.price?.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Add to Cart button - only visible on medium screens and up */}
          {product?.totalStock > 0 && (
            <button
              onClick={(e) => handleAddToCartClick(e, product?._id, product?.totalStock)}
              className="mt-3 w-full py-2 px-3 bg-black text-white rounded-md flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors text-sm hidden sm:flex"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Add to Cart
            </button>
          )}
        </CardContent>

        {/* Mobile-only button (visible on small screens) */}
        <CardFooter className="p-4 pt-0 mt-auto sm:hidden">
          {product?.totalStock === 0 ? (
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-lg bg-gray-200 text-gray-500
              font-medium flex items-center justify-center gap-2 cursor-not-allowed"
            > 
              <ShoppingBag className="w-4 h-4" />
              Out of Stock
            </button>
          ) : (
            <motion.button
              onClick={(e) => handleAddToCartClick(e, product?._id, product?.totalStock)}
              className="w-full py-2.5 px-4 rounded-lg bg-black text-white
              font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </motion.button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default ShoppingProductTile;