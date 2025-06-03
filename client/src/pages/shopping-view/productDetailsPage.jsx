import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTitle from '../../components/common/PageTitle';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, ChevronLeft, ChevronRight, Heart, Info, Truck, ShieldCheck, Tag, MessageCircle, ArrowLeft, Clock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, fetchCartItems } from '../../store/shop/cart-slice';
import { addToWishlist, removeFromWishlist } from '../../store/shop/wishlist-slice';
import { toast } from 'sonner';
import { fetchProductDetails, fetchSimilarProducts } from '../../store/shop/product-slice';
import ReviewForm from '../../components/shopping-view/reviewForm';
import ReviewsDisplay from '../shopping-view/reviewDisplay';
import ShoppingProductTile from '../../components/shopping-view/productTile';
import ProductOptionsModal from '../../components/shopping-view/productOptionsModal';
import NewArrivals from './newArrivals';
import { fetchAllTaxonomyData } from '@/store/superAdmin/taxonomy-slice';

// Image Gallery Component for Product Details - Valentino style layout
function ImageGallery({ productDetails }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Combine main image with additional images
  useEffect(() => {
    if (productDetails && productDetails.image) {
      const imageArray = [productDetails.image];
      if (productDetails.additionalImages && Array.isArray(productDetails.additionalImages)) {
        imageArray.push(...productDetails.additionalImages);
      }
      setAllImages(imageArray);
      setCurrentImageIndex(0);
      setIsZoomed(false);
    }
  }, [productDetails]);

  // Handle zoom functionality
  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!allImages.length) return null;

  return (
    <div className="flex flex-col md:flex-row gap-4 relative">
      {/* Vertical Thumbnails - Left Side */}
      <div className="hidden md:flex flex-col gap-2 overflow-y-auto max-h-[500px] hide-scrollbar">
        {allImages.map((image, индекс) => (
          <button
            key={индекс}
            onClick={() => setCurrentImageIndex(индекс)}
            className={`relative flex-shrink-0 cursor-pointer rounded-md overflow-hidden w-16 h-20 border ${currentImageIndex === индекс ? 'border-black' : 'border-gray-200 hover:border-gray-300'} transition-all duration-200`}
          >
            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
              <img
                src={image}
                alt={`Thumbnail ${индекс + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </button>
        ))}
      </div>

      {/* Main Image - Right Side */}
      <div className="flex-1 relative">
        <div
          className={`relative overflow-hidden rounded-lg bg-gray-100 flex justify-center items-center h-[500px] cursor-${isZoomed ? 'zoom-out' : 'zoom-in'}`}
          onClick={toggleZoom}
          onMouseMove={handleMouseMove}
        >
          <img
            src={allImages[currentImageIndex]}
            alt={productDetails?.name || 'Product image'}
            className={`${isZoomed ? 'absolute scale-150' : 'max-w-full max-h-full'} object-contain transition-transform duration-200`}
            style={isZoomed ? {
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
            } : {}}
          />
          {!isZoomed && (
            <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </div>
          )}
        </div>

        {/* Mobile Thumbnails - Below Main Image (visible only on mobile) */}
        {allImages.length > 1 && (
          <div className="flex md:hidden justify-center gap-3 overflow-x-auto pt-4 pb-2 hide-scrollbar">
            {allImages.map((image, индекс) => (
              <button
                key={индекс}
                onClick={() => setCurrentImageIndex(индекс)}
                className={`relative flex-shrink-0 cursor-pointer rounded-md overflow-hidden w-16 h-16 border ${currentImageIndex === индекс ? 'border-black' : 'border-gray-200 hover:border-gray-300'} transition-all duration-200`}
              >
                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                  <img
                    src={image}
                    alt={`Thumbnail ${индекс + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-sm hover:bg-white focus:outline-none opacity-0 hover:opacity-100 transition-opacity duration-200 group-hover:opacity-100"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-sm hover:bg-white focus:outline-none opacity-0 hover:opacity-100 transition-opacity duration-200 group-hover:opacity-100"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </button>
          </>
        )}
      </div>

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

  const isInWishlist = wishlistItems?.some(item =>
    item.productId === productDetails?._id ||
    item.productId?._id === productDetails?._id
  );

  const similarProductsRef = useRef(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  // Utility function to convert database IDs to human-readable names
  const convertIdToName = (id, taxonomyArray) => {
    if (!id || !taxonomyArray || taxonomyArray.length === 0) return id;
    
    // If it's already a human-readable name (not a MongoDB ObjectId), return as is
    if (typeof id === 'string' && id.length !== 24) return id;
    
    // Find the taxonomy item by ID
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
    if (productId) {
      dispatch(fetchProductDetails(productId));
      dispatch(fetchSimilarProducts(productId))
        .then((response) => {
          console.log('Similar products response:', response.payload);
        });
    }
    // Fetch taxonomy data for ID to name conversion
    dispatch(fetchAllTaxonomyData());
  }, [productId, dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      if (similarProductsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = similarProductsRef.current;
        setShowLeftButton(scrollLeft > 0);
        setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const scrollContainer = similarProductsRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [similarProducts]);

  const scrollLeft = () => {
    if (similarProductsRef.current) {
      similarProductsRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (similarProductsRef.current) {
      similarProductsRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  function handleToggleWishlist(productId) {
    if (!isAuthenticated) {
      toast.info("Please login to add items to your wishlist", {
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
      console.error("User is authenticated but ID is missing:", user);
      toast.error("User information is incomplete. Please try logging in again.");
      return;
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
        userId,
        productId: targetProductId
      }));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addToWishlist({
        userId,
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
      console.error("User is authenticated but ID is missing:", user);
      toast.error("User information is incomplete. Please try logging in again.");
      return;
    }

    if (!productDetails || !productDetails._id) {
      toast.error("Product information is missing");
      return;
    }

    setIsAddingToCart(true);

    // IMPORTANT: Use the correct price field - price is the actual price customer pays (42 for Snake Crew Sweatshirt)
    // salePrice is the original price shown with strikethrough (60 for Snake Crew Sweatshirt)
    dispatch(addToCart({
      userId,
      productId: productDetails._id,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      price: productDetails.price, // Just use the price field directly - it already contains the customer-facing price
      title: productDetails.title,
      image: productDetails.image,
      adminId: productDetails.createdBy,
      adminName: productDetails.createdByName || productDetails.adminName || 'Vendor'
      // salePrice removed to align with backend changes
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
      <PageTitle title={productDetails?.title || 'Product Details'} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <ImageGallery productDetails={productDetails} />
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {productDetails.title}
            </h1>

            <p className="text-gray-500 text-sm mb-3">
              <span className="inline-flex items-center">
                <Truck className="w-3 h-3 mr-1" />
                Additional shipping costs may apply.
                <a href="/shop/shipping" className="underline hover:text-gray-700 ml-1">View shipping rates</a>
              </span>
            </p>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-black">
                  GHS{productDetails?.price}
                </p>
                {productDetails?.salePrice > 0 && (
                  <p className="text-xl font-bold text-gray-400 line-through">
                    GHS{productDetails?.salePrice}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleToggleWishlist()}
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
              >
                <Heart
                  className={`w-6 h-6 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
                />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-black text-black" />
                ))}
              </div>
              <span className="text-gray-600">(4.5)</span>
            </div>

            {getDisplaySizes().length > 0 && (
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
                  {getDisplaySizes().map((size) => {
                    const isDisabled = false;
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

            {getDisplayColors().length > 0 && (
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
                      ></div>
                    )}
                  </div>
                  Select Color
                  {colorError && <span className="text-red-500 text-xs ml-2">Required</span>}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                    {getDisplayColors().map((color) => {
                      const colorMap = {
                        white: '#FFFFFF',
                        black: '#000000',
                        red: '#FF0000',
                        blue: '#0000FF',
                        green: '#008000',
                        yellow: '#FFFF00',
                        purple: '#800080',
                        orange: '#FFA500',
                        pink: '#FFC0CB',
                        gray: '#808080',
                        brown: '#A52A2A',
                        navy: '#000080',
                        beige: '#F5F5DC',
                        teal: '#008080',
                        gold: '#FFD700',
                        silver: '#C0C0C0',
                        maroon: '#800000',
                        olive: '#808000',
                        khaki: '#F0E68C',
                        coral: '#FF7F50',
                        turquoise: '#40E0D0',
                        multicolor: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
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
                            ></div>
                          </button>
                          <span className="text-xs text-center">{color.toLowerCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
                Quantity
              </h3>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-12 h-12 border border-gray-300 flex items-center justify-center text-lg rounded-l-md hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <div className="w-16 h-12 border-t border-b border-gray-300 flex items-center justify-center font-medium">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(prev => Math.min(productDetails?.totalStock || 10, prev + 1))}
                  className="w-12 h-12 border border-gray-300 flex items-center justify-center text-lg rounded-r-md hover:bg-gray-100 transition-colors"
                  disabled={quantity >= (productDetails?.totalStock || 10)}
                >
                  +
                </button>
              </div>
            </div>

            {productDetails?.totalStock > 0 && productDetails?.totalStock < 5 && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-orange-700 font-medium flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Only <span className="font-bold">{productDetails.totalStock}</span> items left in stock - order soon!
                </p>
              </div>
            )}
            {productDetails?.totalStock === 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 font-medium flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  This item is currently out of stock
                </p>
              </div>
            )}

            {productDetails?.totalStock === 0 ? (
              <button
                className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 opacity-60 cursor-not-allowed shadow-md mb-8"
              >
                <ShoppingBag className="w-5 h-5" />
                Out Of Stock
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 shadow-md transition-colors mb-8"
              >
                {isAddingToCart ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Add to Cart - GHS {productDetails?.price?.toFixed(2)}
                  </span>
                )}
              </button>
            )}

            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-600" />
                Description
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div 
                  className="text-gray-600 leading-relaxed prose prose-sm max-w-none" 
                  dangerouslySetInnerHTML={{ __html: productDetails?.description || '' }}
                />
              </div>
            </div>

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
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Customer Reviews
          </h2>

          <div className="mb-8">
            {productDetails?._id && <ReviewsDisplay productId={productDetails?._id} />}
          </div>

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

        <div className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6" />
              You May Also Like
            </h2>

            {similarProductsLoading ? (
              <div className="flex overflow-x-auto pb-4 hide-scrollbar">
                {Array(8).fill(0).map((_, индекс) => (
                  <div key={индекс} className="flex-shrink-0 w-64 mx-2 first:ml-0 last:mr-0 bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="aspect-square bg-gray-200 animate-pulse"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : similarProducts.length > 0 ? (
              <div className="relative">
                <div className="relative">
                  {showLeftButton && (
                    <button
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md"
                      onClick={scrollLeft}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}
                  {showRightButton && (
                    <button
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md"
                      onClick={scrollRight}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}
                </div>

                <div
                  ref={similarProductsRef}
                  className="flex overflow-x-auto pb-6 hide-scrollbar"
                >
                  {similarProducts.map(product => {
                    const isInWishlist = wishlistItems?.some(item =>
                      item.productId === product._id ||
                      item.productId?._id === product._id
                    );

                    return (
                      <div
                        key={product._id}
                        className="flex-shrink-0 w-64 mx-2 first:ml-0 last:mr-0 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="relative">
                          {product.salePrice > 0 && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-sm uppercase font-bold">
                              Sale
                            </div>
                          )}
                          {product.stock < 5 && product.stock > 0 && (
                            <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-sm uppercase font-bold">
                              Low Stock
                            </div>
                          )}
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full aspect-square object-cover cursor-pointer"
                            onClick={() => navigate(`/shop/product/${product._id}`)}
                          />
                          <button
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-sm hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(product._id);
                            }}
                          >
                            <Heart
                              className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                            />
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="mb-1 text-xs text-gray-500 uppercase tracking-wide">
                            {convertIdToName(product.brand, brands)}
                            {product.category && <span className="ml-2">{convertIdToName(product.category, categories)}</span>}
                          </div>
                          <h3
                            className="font-medium text-gray-900 mb-1 truncate cursor-pointer hover:text-black hover:underline"
                            onClick={() => navigate(`/shop/product/${product._id}`)}
                          >
                            {product.title}
                          </h3>
                          <div className="flex items-end gap-2 mb-3">
                            <span className="font-bold text-lg">GHS {product.price}</span>
                            {product.salePrice > 0 && (
                              <span className="text-gray-400 line-through text-sm">GHS {product.salePrice}</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAuthenticated) {
                                toast.error("Please login to add items to your cart");
                                return;
                              }
                              setSelectedModalProduct(product);
                              setIsOptionsModalOpen(true);
                            }}
                            className="w-full bg-black text-white py-2.5 rounded flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No similar products found
              </div>
            )}
          </div>
        </div>

        <NewArrivals />
      </main>

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