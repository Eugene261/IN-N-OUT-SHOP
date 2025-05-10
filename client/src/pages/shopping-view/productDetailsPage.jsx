import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Star, ChevronLeft, ChevronRight, Heart, Info, Truck, ShieldCheck, Tag, MessageCircle, ArrowLeft } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, fetchCartItems } from '../../store/shop/cart-slice'
import { addToWishlist, removeFromWishlist } from '../../store/shop/wishlist-slice'
import { toast } from 'sonner'
import { fetchProductDetails, fetchSimilarProducts } from '../../store/shop/product-slice'
import ReviewForm from '../../components/shopping-view/reviewForm'
import ReviewsDisplay from '../shopping-view/reviewDisplay'
import ShoppingProductTile from '../../components/shopping-view/productTile'
import ProductOptionsModal from '../../components/shopping-view/productOptionsModal'

// Image Gallery Component for Product Details
function ImageGallery({ productDetails }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);
  
  // Combine main image with additional images
  useEffect(() => {
    if (productDetails && productDetails.image) {
      // Start with the main image
      const imageArray = [productDetails.image];
      
      // Add any additional images if they exist
      if (productDetails.additionalImages && Array.isArray(productDetails.additionalImages)) {
        imageArray.push(...productDetails.additionalImages);
      }
      
      setAllImages(imageArray);
      // Reset current image index when product changes
      setCurrentImageIndex(0);
    }
  }, [productDetails]);

  const goToPrevious = () => {
    setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  if (!allImages.length) return null;

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100 mb-4 flex justify-center items-center" style={{ height: '500px' }}>
        <img
          src={allImages[currentImageIndex]}
          alt={productDetails?.name || 'Product image'}
          className="max-w-full max-h-full object-contain"
        />
        
        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-sm hover:bg-white focus:outline-none"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-sm hover:bg-white focus:outline-none"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnail Navigation - Show horizontally below the main image */}
      {allImages.length > 1 && (
        <div className="flex justify-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative flex-shrink-0 cursor-pointer rounded-md overflow-hidden w-24 h-24 border-2 ${currentImageIndex === index ? 'border-black' : 'border-transparent hover:border-gray-300'} transition-all duration-200 ${currentImageIndex === index ? 'shadow-md' : ''}`}
            >
              <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add custom scrollbar hiding style */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get product details from Redux store
  const { 
    productDetails, 
    isLoading: loading,
    similarProducts,
    similarProductsLoading 
  } = useSelector(state => state.shopProducts);
  const { wishlistItems } = useSelector(state => state.wishlist);
  const { user } = useSelector(state => state.auth);
  const isAuthenticated = !!user;
  
  // Local state
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedModalProduct, setSelectedModalProduct] = useState(null);
  
  // Check if product is in wishlist
  const isInWishlist = wishlistItems?.some(item => 
    item.productId === productDetails?._id || 
    item.productId?._id === productDetails?._id
  );
  
  // Fetch product details when component mounts or productId changes
  useEffect(() => {
    if (productId) {
      dispatch(fetchProductDetails(productId));
      dispatch(fetchSimilarProducts(productId));
    }
  }, [productId, dispatch]);

  // Handle toggling wishlist
  function handleToggleWishlist() {
    if (!isAuthenticated) {
      toast.error("Please login to add items to your wishlist");
      return;
    }
    
    // Ensure user ID is available
    const userId = user?.id || user?._id;
    if (!userId) {
      console.error("User is authenticated but ID is missing:", user);
      toast.error("User information is incomplete. Please try logging in again.");
      return;
    }
    
    if (!productDetails || !productDetails._id) {
      toast.error("Product information is missing");
      return;
    }
    
    if (isInWishlist) {
      dispatch(removeFromWishlist({
        userId,
        productId: productDetails._id
      }));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addToWishlist({
        userId,
        productId: productDetails._id
      }));
      toast.success("Added to wishlist");
    }
  }

  // Handle adding to cart
  function handleAddToCart() {
    // Validate size and color if they are available for the product
    if (productDetails?.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      toast.error("Please select a size");
      return;
    }
    
    if (productDetails?.colors?.length > 0 && !selectedColor) {
      setColorError(true);
      toast.error("Please select a color");
      return;
    }
    
    if (!isAuthenticated) {
      toast.error("Please login to add items to your cart");
      return;
    }
    
    // Ensure user ID is available
    const userId = user?.id || user?._id;
    if (!userId) {
      console.error("User is authenticated but ID is missing:", user);
      toast.error("User information is incomplete. Please try logging in again.");
      return;
    }
    
    if (!productDetails || !productDetails._id) {
      toast.error("Product information is missing");
      return;
    }
    
    setIsAddingToCart(true);
    
    dispatch(addToCart({
      userId,
      productId: productDetails._id,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined
    }))
      .then(() => {
        toast.success("Added to cart");
        setIsAddingToCart(false);
      })
      .catch(error => {
        console.error("Error adding to cart:", error);
        toast.error("Failed to add to cart");
        setIsAddingToCart(false);
      });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/shop/home')}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images - Left Side */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <ImageGallery productDetails={productDetails} />
          </div>
          
          {/* Product Details - Right Side */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            {/* Product Title */}
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {productDetails.title}
            </h1>
            
            {/* Price and Wishlist */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-end gap-2">
                {/* Regular price */}
                <p className="text-2xl font-bold text-black">
                  GHS{productDetails?.price}
                </p>
                
                {/* Sale price if available */}
                {productDetails?.salePrice > 0 && (
                  <p className="text-xl font-bold text-gray-400 line-through">
                    GHS{productDetails?.salePrice}
                  </p>
                )}
              </div>
              
              {/* Wishlist button */}
              <button
                onClick={handleToggleWishlist}
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
              >
                <Heart 
                  className={`w-6 h-6 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
                />
              </button>
            </div>
            
            {/* Ratings */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-black text-black"/>
                ))}
              </div>
              <span className="text-gray-600">(4.5)</span>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-600" />
                Description
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 leading-relaxed">
                  {productDetails?.description}
                </p>
              </div>
            </div>
            
            {/* Shipping Information */}
            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-600" />
                Shipping & Returns
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <Truck className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>Free shipping on orders over GHS 100</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>30-day return policy</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Size Selection - Only show if product has sizes */}
            {productDetails?.sizes?.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-600" />
                    Select Size
                    {sizeError && <span className="text-red-500 text-xs ml-2">Required</span>}
                  </h3>
                  <button 
                    type="button" 
                    className="text-xs font-medium text-gray-600 hover:text-black flex items-center uppercase tracking-wider"
                  >
                    SIZE CHART
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {productDetails.sizes.map((size) => {
                    // Check if size should be disabled (out of stock)
                    const isDisabled = false; // In a real app, this would check inventory
                    
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedSize(size);
                          setSizeError(false);
                        }}
                        className={`
                          px-3 py-3 border text-sm font-medium transition-colors uppercase tracking-wide
                          ${isDisabled ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200' : ''}
                          ${selectedSize === size
                            ? 'border-black bg-gray-100 text-black'
                            : 'border-gray-300 bg-white text-black hover:border-gray-500'}
                          ${sizeError && !selectedSize ? 'border-red-500' : ''}
                        `}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Color Selection - Only show if product has colors */}
            {productDetails?.colors?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-gray-300 overflow-hidden flex-shrink-0">
                    {selectedColor && (
                      <div 
                        className="w-full h-full"
                        style={{ 
                          background: selectedColor === 'multicolor' 
                            ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
                            : selectedColor.toLowerCase()
                        }}
                      />
                    )}
                  </div>
                  Select Color
                  {colorError && <span className="text-red-500 text-xs ml-2">Required</span>}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                    {productDetails.colors.map((color) => {
                      // Map color names to actual CSS color values
                      const colorMap = {
                        'white': '#FFFFFF',
                        'black': '#000000',
                        'red': '#FF0000',
                        'blue': '#0000FF',
                        'green': '#008000',
                        'yellow': '#FFFF00',
                        'purple': '#800080',
                        'orange': '#FFA500',
                        'pink': '#FFC0CB',
                        'gray': '#808080',
                        'brown': '#A52A2A',
                        'navy': '#000080',
                        'beige': '#F5F5DC',
                        'teal': '#008080',
                        'gold': '#FFD700',
                        'silver': '#C0C0C0',
                        'maroon': '#800000',
                        'olive': '#808000',
                        'khaki': '#F0E68C',
                        'coral': '#FF7F50',
                        'turquoise': '#40E0D0',
                        'multicolor': 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
                      };
                      
                      const bgColor = colorMap[color.toLowerCase()] || '#CCCCCC';
                      const borderColor = color.toLowerCase() === 'white' ? 'border-gray-300' : 'border-transparent';
                      
                      return (
                        <div className="flex flex-col items-center" key={color}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedColor(color);
                              setColorError(false);
                            }}
                            className={`
                              w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-transform mb-1
                              ${selectedColor === color ? 'ring-2 ring-black scale-110' : `border ${borderColor}`}
                            `}
                            aria-label={`Select ${color} color`}
                          >
                            <div 
                              className="w-full h-full rounded-full"
                              style={{ background: bgColor }}
                            />
                          </button>
                          <span className="text-xs text-center">{color.toLowerCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Quantity Selector */}
            <div className="mb-8">
              <h3 className="text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
                Quantity
              </h3>
              <div className="flex items-center">
                <button 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-12 h-12 border border-gray-300 flex items-center justify-center text-lg rounded-l-md
                  hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <div className="w-16 h-12 border-t border-b border-gray-300 flex items-center justify-center font-medium">
                  {quantity}
                </div>
                <button 
                  onClick={() => setQuantity(prev => Math.min(productDetails?.totalStock || 10, prev + 1))}
                  className="w-12 h-12 border border-gray-300 flex items-center justify-center text-lg rounded-r-md
                  hover:bg-gray-100 transition-colors"
                  disabled={quantity >= (productDetails?.totalStock || 10)}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Add to Cart Button */}
            {
              productDetails?.totalStock === 0 ? (
                <button
                  className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-medium 
                  flex items-center justify-center gap-2 opacity-60 cursor-not-allowed shadow-md"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Out Of Stock
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium 
                  flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  {isAddingToCart ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      Add to Cart - ${productDetails?.price?.toFixed(2)}
                    </span>
                  )}
                </button>
              )
            }
          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="mt-12 bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Customer Reviews
          </h2>
          
          {/* Reviews Display */}
          <div className="mb-8">
            {productDetails?._id && <ReviewsDisplay productId={productDetails?._id} />}
          </div>

          {/* Review Form */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-4">Write a Review</h3>
            {productDetails?._id && user?.id ? (
              <ReviewForm 
                productId={productDetails?._id} 
                userId={user?.id}
                userName={user?.userName}
              />
            ) : (
              <p className="text-gray-500 italic">Please log in to leave a review</p>
            )}
          </div>
        </div>

        {/* Similar Products Section */}
        <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center sm:text-left">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {similarProductsLoading ? (
                // Loading skeletons
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="aspect-square bg-gray-200 animate-pulse"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : similarProducts.length > 0 ? (
                similarProducts.map(product => (
                  <ShoppingProductTile 
                    key={product._id}
                    product={product}
                    onAddToCart={() => {
                      if (!isAuthenticated) {
                        toast.error("Please login to add items to your cart");
                        return;
                      }
                      // Open the product options modal with the selected product
                      setSelectedModalProduct(product);
                      setIsOptionsModalOpen(true);
                    }}
                    onProductClick={() => navigate(`/shop/product/${product._id}`)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No similar products found
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Product Options Modal for Similar Products */}
      <ProductOptionsModal 
        isOpen={isOptionsModalOpen} 
        onClose={() => setIsOptionsModalOpen(false)} 
        product={selectedModalProduct}
        onAddToCart={() => {
          setIsOptionsModalOpen(false);
          dispatch(fetchCartItems(user?._id || user?.id));
        }}
      />
    </div>
  );
}

export default ProductDetailsPage;
