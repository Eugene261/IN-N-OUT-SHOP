import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTitle from '../../components/common/PageTitle';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Heart, Share, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, fetchCartItems } from '../../store/shop/cart-slice';
import { addToWishlist, removeFromWishlist } from '../../store/shop/wishlist-slice';
import { toast } from 'sonner';
import { fetchProductDetails, fetchSimilarProducts } from '../../store/shop/product-slice';
import ReviewForm from '../../components/shopping-view/reviewForm';
import ReviewsDisplay from '../shopping-view/reviewDisplay';
import EnhancedShoppingProductTile from '../../components/shopping-view/enhanced-product-tile';
import ProductOptionsModal from '../../components/shopping-view/productOptionsModal';
import { fetchAllTaxonomyData } from '@/store/superAdmin/taxonomy-slice';
import { navigateWithScroll } from '../../utils/scrollUtils';

// Image Gallery Component for Clean Layout
function ImageGallery({ productDetails }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);

  useEffect(() => {
    if (productDetails && productDetails.image) {
      const imageArray = [productDetails.image];
      if (productDetails.additionalImages && Array.isArray(productDetails.additionalImages)) {
        imageArray.push(...productDetails.additionalImages);
      }
      setAllImages(imageArray);
      setCurrentImageIndex(0);
    }
  }, [productDetails]);

  if (!allImages.length) return null;

  return (
    <div className="space-y-4">
      {/* Main Image - Fully Responsive to Image Dimensions */}
      <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
        <img
          src={allImages[currentImageIndex]}
          alt={productDetails?.title || 'Product image'}
          className="w-full h-auto object-contain rounded-lg"
        />
      </div>

      {/* Thumbnail Gallery - Clean Row Below */}
      {allImages.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all flex items-center justify-center bg-gray-50 ${
                currentImageIndex === index 
                  ? 'border-gray-900' 
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img
                src={image}
                alt={`${productDetails?.title || 'Product'} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    productDetails,
    isLoading: loading,
    similarProducts,
    similarProductsLoading
  } = useSelector(state => state.shopProducts);
  const { wishlistItems } = useSelector(state => state.wishlist);
  const { user } = useSelector(state => state.auth);
  const { sizes, colors, brands, categories } = useSelector(state => state.taxonomy);
  const isAuthenticated = !!user;

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedModalProduct, setSelectedModalProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('description');

  const isInWishlist = wishlistItems?.some(item =>
    item.productId === productDetails?._id ||
    item.productId?._id === productDetails?._id
  );

  // Utility function to convert database IDs to human-readable names
  const convertIdToName = (id, taxonomyArray) => {
    if (!id || !taxonomyArray || taxonomyArray.length === 0) return id;
    if (typeof id === 'string' && id.length !== 24) return id;
    const item = taxonomyArray.find(item => item._id === id);
    return item ? item.name : id;
  };

  // Convert product sizes and colors for display
  const getDisplaySizes = () => {
    if (!productDetails?.sizes) return [];
    return productDetails.sizes.map(size => convertIdToName(size, sizes));
  };

  const getDisplayColors = () => {
    if (!productDetails?.colors) return [];
    return productDetails.colors.map(color => convertIdToName(color, colors));
  };

  useEffect(() => {
    if (!productId || productId === 'undefined' || productId === 'null') {
      navigate('/shop/listing', { replace: true });
      return;
    }
  }, [productId, navigate]);

  useEffect(() => {
    if (productId && productId !== 'undefined') {
      dispatch(fetchProductDetails(productId));
      dispatch(fetchSimilarProducts(productId));
    }
    dispatch(fetchAllTaxonomyData());
  }, [productId, dispatch, navigate]);

  function handleToggleWishlist(productId) {
    let wishlistParams = {};
    
    if (isAuthenticated && user && (user._id || user.id)) {
      wishlistParams.userId = user._id || user.id;
    } else {
      let guestId = localStorage.getItem('guestId');
      if (!guestId) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestId', guestId);
      }
      wishlistParams.guestId = guestId;
    }

    const targetProductId = productId || productDetails?._id;
    if (!targetProductId) {
      toast.error("Product information is missing");
      return;
    }

    const isProductInWishlist = wishlistItems?.some(item =>
      item.productId === targetProductId ||
      item.productId?._id === targetProductId
    );

    if (isProductInWishlist) {
      dispatch(removeFromWishlist({
        ...wishlistParams,
        productId: targetProductId
      }));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addToWishlist({
        ...wishlistParams,
        productId: targetProductId
      }));
      toast.success("Added to wishlist");
    }
  }

  function handleAddToCart() {
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
      toast.info("Please login to add items to your cart", {
        description: "You'll be redirected to the login page",
        duration: 3000
      });
      setTimeout(() => {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/auth/login');
      }, 1500);
      return;
    }

    const userId = user?.id || user?._id;
    if (!userId) {
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
      color: selectedColor || undefined,
      price: productDetails.price,
      title: productDetails.title,
      image: productDetails.image,
      adminId: productDetails.createdBy,
      adminName: productDetails.createdByName || productDetails.adminName || 'Vendor'
    }))
      .then(() => {
        toast.success("Added to cart");
        setIsAddingToCart(false);
      })
      .catch(error => {
        toast.error("Failed to add to cart");
        setIsAddingToCart(false);
      });
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: productDetails?.title,
        text: `Check out this ${productDetails?.title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

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

  const reviewCount = 5; // This should come from actual review data

  return (
    <div className="min-h-screen bg-white">
      <PageTitle title={productDetails?.title || 'Product Details'} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Product Details Section - Clean Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          {/* Left Column - Product Images */}
          <div>
            <ImageGallery productDetails={productDetails} />
          </div>

          {/* Right Column - Product Information */}
          <div className="space-y-6">
            {/* Product Title */}
            <h1 className="text-3xl font-semibold text-gray-900">
              {productDetails.title}
            </h1>

            {/* Price Display */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">
                GHS {productDetails?.price}
              </span>
              {productDetails?.salePrice > 0 && (
                <span className="text-xl text-gray-500 line-through">
                  GHS {productDetails?.salePrice}
                </span>
              )}
            </div>

            {/* Star Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-gray-600">({reviewCount} reviews)</span>
            </div>

            {/* Color Selection Dropdown */}
            {getDisplayColors().length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                  Color
                </label>
                <select
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    setColorError(false);
                  }}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white ${
                    colorError ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose Color</option>
                  {getDisplayColors().map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Size Selection Dropdown */}
            {getDisplaySizes().length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                  Size
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => {
                    setSelectedSize(e.target.value);
                    setSizeError(false);
                  }}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white ${
                    sizeError ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose Size</option>
                  {getDisplaySizes().map((size) => (
                    <option key={size} value={size}>
                      {size.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity Selection with +/- Buttons */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="p-3 hover:bg-gray-50 transition-colors border-r border-gray-300"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 py-3 font-medium text-center min-w-[4rem]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(prev => Math.min(productDetails?.totalStock || 10, prev + 1))}
                  className="p-3 hover:bg-gray-50 transition-colors border-l border-gray-300"
                  disabled={quantity >= (productDetails?.totalStock || 10)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button - Black Background */}
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || productDetails?.totalStock === 0}
                className="flex-1 bg-gray-900 hover:bg-black text-white py-3 px-8 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isAddingToCart ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </span>
                ) : productDetails?.totalStock === 0 ? (
                  'OUT OF STOCK'
                ) : (
                  'ADD TO CART'
                )}
              </button>
            </div>

            {/* Wishlist and Share Links */}
            <div className="flex items-center space-x-6 pt-4">
              <button
                onClick={() => handleToggleWishlist()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-sm">Add to wishlist</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </button>
            </div>

            {/* Category and Tags Information */}
            <div className="pt-6 border-t border-gray-200 space-y-3">
              <div className="flex items-center">
                <span className="text-gray-600 font-medium w-20">Category</span>
                <span className="text-gray-900">
                  {convertIdToName(productDetails?.category, categories) || 'Summer collection, Shirt'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 font-medium w-20">Tags</span>
                <span className="text-gray-900">
                  {convertIdToName(productDetails?.brand, brands) || 'Company Name'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'description', label: 'Description' },
              { id: 'additional', label: 'Additional Information' },
              { id: 'reviews', label: `Reviews (${reviewCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-16">
          {activeTab === 'description' && (
            <div className="prose max-w-none text-gray-600 leading-relaxed">
              <div dangerouslySetInnerHTML={{ 
                __html: productDetails?.description || 
                `When white the lovely valley teems with vapour around me, and the meridian sun strikes the upper surface of the impenetrable foliage of my trees, and but a few stray gleams steal into the inner sanctuary, I throw myself down among the tall grass by the trickling stream; and, as I lie close to the earth, a thousand unknown plants are noticed by me: when I hear the buzz of the little world among the stalks, and grow familiar with the countless indescribable forms of the insects and flies, then I feel the presence of the Almighty, who formed us in his own image, and the breath of that universal love which bears and sustains us, as it floats around us in an eternity of bliss; and then, my friend, when darkness overspreads my eyes.`
              }} />
            </div>
          )}

          {activeTab === 'additional' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Product Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Brand:</dt>
                      <dd className="text-gray-900 font-medium">{convertIdToName(productDetails?.brand, brands) || 'Fashion Brand'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Material:</dt>
                      <dd className="text-gray-900 font-medium">Cotton Blend</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Care Instructions:</dt>
                      <dd className="text-gray-900 font-medium">Machine Wash</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Origin:</dt>
                      <dd className="text-gray-900 font-medium">Made in Ghana</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Shipping Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Weight:</dt>
                      <dd className="text-gray-900 font-medium">0.5 kg</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Dimensions:</dt>
                      <dd className="text-gray-900 font-medium">30 × 20 × 5 cm</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Shipping Time:</dt>
                      <dd className="text-gray-900 font-medium">2-5 business days</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <div>
                {productDetails?._id && <ReviewsDisplay productId={productDetails?._id} />}
              </div>
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
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
          )}
        </div>

        {/* Related Products Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
          
          {similarProductsLoading ? (
            <div className="flex overflow-x-auto pb-6 hide-scrollbar gap-4">
              {Array(4).fill(0).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-72">
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="aspect-square bg-gray-200 animate-pulse"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : similarProducts.length > 0 ? (
            <div className="relative">
              {/* Scroll buttons */}
              <button
                onClick={() => {
                  const container = document.querySelector('.related-products-scroll');
                  container?.scrollBy({ left: -300, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <button
                onClick={() => {
                  const container = document.querySelector('.related-products-scroll');
                  container?.scrollBy({ left: 300, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              {/* Product cards */}
              <div className="flex overflow-x-auto pb-6 hide-scrollbar gap-4 related-products-scroll">
                {similarProducts.map(product => {
                  const isInWishlist = wishlistItems?.some(item =>
                    item.productId === product._id ||
                    item.productId?._id === product._id
                  );

                  return (
                    <div key={product._id} className="flex-shrink-0 w-72">
                      <EnhancedShoppingProductTile
                        product={product}
                        handleGetProductDetails={() => {
                          if (product && product._id) {
                            navigateWithScroll(navigate, `/shop/product/${product._id}`);
                          }
                        }}
                        handleAddToCart={() => {
                          if (!isAuthenticated) {
                            toast.error("Please login to add items to your cart");
                            return;
                          }
                          setSelectedModalProduct(product);
                          setIsOptionsModalOpen(true);
                        }}
                        handleAddToWishlist={(productId) => handleToggleWishlist(productId)}
                        isInWishlist={isInWishlist}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No related products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Options Modal */}
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

// CSS for hiding scrollbars (same as NewArrivals component)
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

export default ProductDetailsPage;