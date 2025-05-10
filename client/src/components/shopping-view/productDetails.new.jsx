import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { ShoppingBag, Star, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, fetchCartItems } from '@/store/shop/cart-slice'
import { toast } from 'sonner'
import { setProductDetails } from '@/store/shop/product-slice'
import ReviewForm from '../../components/shopping-view/reviewForm'
import ReviewsDisplay from '../../pages/shopping-view/reviewDisplay'

// Image Gallery Component for Product Details
function ImageGallery({ productDetails }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);
  
  // Combine main image with additional images
  useEffect(() => {
    if (productDetails) {
      const images = [productDetails.image];
      if (productDetails.additionalImages && Array.isArray(productDetails.additionalImages)) {
        images.push(...productDetails.additionalImages);
      }
      setAllImages(images);
    }
  }, [productDetails]);

  const goToPrevious = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex(prev => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  if (!allImages.length) return null;

  return (
    <div className="relative h-full flex flex-col">
      {/* Main Image */}
      <div className="flex-grow relative">
        <img
          src={allImages[currentImageIndex]}
          alt={`Product view ${currentImageIndex + 1}`}
          className="w-full h-full object-contain"
        />
        
        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button 
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnail Navigation */}
      {allImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-4 px-4">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-16 h-16 border-2 overflow-hidden transition-all ${
                currentImageIndex === index 
                  ? 'border-black' 
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img 
                src={image} 
                alt={`Thumbnail ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetailsDialog({open, setOpen, productDetails}) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.auth);
  const {cartItems} = useSelector(state => state.shopCart);

  function handleAddToCart(getCurrentProductId, getTotalStock){
    // Validate size and color selection
    if (!selectedSize) {
      setSizeError(true);
      toast.error('Please select a size', {
        position: 'top-center',
        duration: 2000
      });
      return;
    }
    
    if (!selectedColor) {
      setColorError(true);
      toast.error('Please select a color', {
        position: 'top-center',
        duration: 2000
      });
      return;
    }

    // Reset errors if validation passes
    setSizeError(false);
    setColorError(false);
    
    let getCartItems = cartItems.items || [];
      
    if(getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex(item => 
        item.productId === getCurrentProductId && 
        item.size === selectedSize && 
        item.color === selectedColor
      );
      
      if(indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;
  
        // Check if current quantity + 1 would exceed total stock
        if(getQuantity >= getTotalStock) {
          toast.error(`Only ${getTotalStock} items can be added for this product`, {
            position: 'top-center',
            duration: 2000
          })
          return
        }
      }
    }

    dispatch(addToCart({ 
      userId: user?.id, 
      productId: getCurrentProductId, 
      quantity: 1,
      size: selectedSize,
      color: selectedColor
    })).then((data) => {
      if(data?.payload.success){
        dispatch(fetchCartItems(user?.id))
        toast.success('Product added to basket', {
          position: 'top-center',
          duration: 2000
        });
        // Reset selections after successful add
        setSelectedSize('');
        setSelectedColor('');
      }
    })
  }

  function handleDialogClose(){
    setOpen(false);
    dispatch(setProductDetails());
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <AnimatePresence>
        {open && (
          <DialogContent 
            className="flex flex-col max-h-[95vh] max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] 
              xl:max-w-[70vw] border-0 bg-white overflow-hidden shadow-xl p-0"
            forceMount
          >
            {/* Add DialogTitle for accessibility - using the existing title */}
            <DialogTitle className="sr-only">
              {productDetails?.title || "Product Details"}
            </DialogTitle>
            
            {/* Close button */}
            <motion.button 
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-50 rounded-full p-1.5 bg-black text-white 
              hover:bg-gray-800 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Responsive Layout Container */}
            <div className="flex flex-col lg:flex-row w-full max-h-[95vh] overflow-hidden">
              {/* Product Image - Left Side for desktop, top for mobile */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative flex-shrink-0 w-full lg:w-1/2 overflow-hidden bg-gray-100 flex flex-col"
              >
                {/* Main Image Container */}
                <div className="relative flex-grow">
                  <ImageGallery productDetails={productDetails} />
                  
                  {productDetails?.salePrice > 0 && (
                    <motion.div 
                      className="absolute top-3 left-3 bg-black text-white px-2 py-0.5 
                      rounded-md font-bold text-xs z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      SALE
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Product Details - Right Side for desktop, bottom for mobile */}
              <motion.div 
                className="flex-1 p-4 md:p-6 bg-white text-black overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="mb-6">
                  <motion.h1 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {productDetails?.title}
                  </motion.h1>
                  
                  <motion.p 
                    className="text-gray-600 text-sm sm:text-base mb-3"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {productDetails?.description}
                  </motion.p>

                  <motion.div 
                    className="flex items-center justify-between mb-3"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-end gap-2">
                      {/* Always show regular price */}
                      <p className="text-lg sm:text-2xl font-bold text-black">
                        GHS{productDetails?.price}
                      </p>
                      
                      {/* Show sale price with line-through if it exists */}
                      {productDetails?.salePrice > 0 && (
                        <p className="text-lg sm:text-2xl font-bold text-gray-400 line-through">
                          GHS{productDetails?.salePrice}
                        </p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex items-center gap-2 mb-4"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-black text-black"/>
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm">(4.5)</span>
                  </motion.div>
                  
                  {/* Size Selection - Nike Style */}
                  <motion.div
                    className="mb-6"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-800 flex items-center">
                        Select size
                        {sizeError && <span className="text-red-500 text-xs ml-2">Required</span>}
                      </label>
                      <button 
                        type="button" 
                        className="text-xs font-medium text-gray-600 hover:text-black flex items-center"
                      >
                        Size chart
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {productDetails?.sizes?.map((size) => {
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
                              px-3 py-3 border text-sm font-medium transition-colors
                              ${isDisabled ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200' : ''}
                              ${selectedSize === size
                                ? 'border-black bg-white text-black'
                                : 'border-gray-300 bg-white text-black hover:border-gray-500'}
                              ${sizeError && !selectedSize ? 'border-red-500' : ''}
                            `}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                  
                  {/* Color Selection - Nike Style */}
                  <motion.div
                    className="mb-6"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="mb-2">
                      <label className="text-sm font-medium text-gray-800 flex items-center">
                        Select color
                        {colorError && <span className="text-red-500 text-xs ml-2">Required</span>}
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {productDetails?.colors?.map((color) => {
                        // Map color names to actual CSS color values
                        const colorMap = {
                          'White': '#FFFFFF',
                          'Black': '#000000',
                          'Red': '#FF0000',
                          'Blue': '#0000FF',
                          'Green': '#008000',
                          'Yellow': '#FFFF00',
                          'Purple': '#800080',
                          'Orange': '#FFA500',
                          'Pink': '#FFC0CB',
                          'Gray': '#808080',
                          'Brown': '#A52A2A',
                          'Navy': '#000080',
                          'Beige': '#F5F5DC',
                          'Teal': '#008080',
                          'Gold': '#FFD700',
                          'Silver': '#C0C0C0',
                          'Multicolor': 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
                        };
                        
                        const bgColor = colorMap[color] || '#CCCCCC';
                        const borderColor = color === 'White' ? 'border-gray-300' : 'border-transparent';
                        
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setSelectedColor(color);
                              setColorError(false);
                            }}
                            className={`
                              relative w-12 h-12 rounded-full overflow-hidden transition-transform
                              ${selectedColor === color ? 'ring-2 ring-offset-2 ring-black scale-110' : ''}
                              ${colorError && !selectedColor ? 'ring-2 ring-offset-2 ring-red-500' : ''}
                            `}
                            title={color}
                          >
                            <div 
                              className={`absolute inset-0 ${borderColor} border rounded-full`}
                              style={{ background: bgColor }}
                            ></div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedColor && (
                      <div className="mt-2 text-sm text-gray-700">
                        Selected: {selectedColor}
                      </div>
                    )}
                  </motion.div>

                  {/* Add to Cart Button */}
                  <motion.div 
                    className="mb-4"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {
                      productDetails?.totalStock === 0 ? (
                        <motion.button
                          className="w-full bg-black text-white dark:bg-white dark:text-black 
                          py-3 px-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-gray-900 
                          dark:hover:bg-gray-100 transition-colors opacity-60 cursor-not-allowed"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          Out Of Stock
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={() => handleAddToCart(productDetails?._id, productDetails?.totalStock)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="p-3 rounded-full bg-black text-white 
                          w-full flex items-center justify-center gap-2 font-medium text-base border 
                          border-black transition-all"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          Add to basket
                        </motion.button>
                      )
                    }
                  </motion.div>
                </div>

                <Separator className="bg-gray-200 mb-4" />

                {/* Reviews Section - Using the ReviewsDisplay component */}
                <motion.div 
                  className="mb-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {productDetails?._id && <ReviewsDisplay productId={productDetails?._id} />}
                </motion.div>

                {/* Review Form - Using the ReviewForm component */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  {productDetails?._id && user?.id && (
                    <ReviewForm 
                      productId={productDetails?._id} 
                      userId={user?.id}
                      userName={user?.userName}
                    />
                  )}
                </motion.div>
              </motion.div>
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

export default ProductDetailsDialog
