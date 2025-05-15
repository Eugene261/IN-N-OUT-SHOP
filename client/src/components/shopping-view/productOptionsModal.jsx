import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, fetchCartItems, openCart } from '../../store/shop/cart-slice';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const ProductOptionsModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Reset selections when modal opens with a new product
  useEffect(() => {
    if (isOpen && product) {
      // If product has sizes and colors, select the first one by default
      // Otherwise fallback to default values
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      } else {
        setSelectedSize('M');
      }
      
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      } else {
        setSelectedColor('Black');
      }
      
      setQuantity(1);
      console.log("Product data in modal:", product);
    }
  }, [isOpen, product]);

  // Use product's actual sizes and colors if present, otherwise use fallbacks
  const sizes = product?.sizes && product.sizes.length > 0 
    ? product.sizes 
    : ['S', 'M', 'L', 'XL'];
    
  const colors = product?.colors && product.colors.length > 0 
    ? product.colors 
    : ['Black'];
  
  console.log("Using sizes:", sizes, "and colors:", colors);

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to your cart");
      onClose();
      return;
    }

    // Get user ID
    const userId = user._id || user.id;
    if (!userId) {
      toast.error("User ID is missing. Please try logging in again.");
      onClose();
      return;
    }

    if (!product || !product._id) {
      toast.error("Product information is incomplete.");
      onClose();
      return;
    }

    setIsLoading(true);
    
    // Include price, salePrice, title, and image data to ensure consistency
    // with product details page and proper cart functionality
    const cartData = { 
      userId: userId, 
      productId: product._id, 
      quantity: quantity,
      size: selectedSize,
      color: selectedColor,
      price: product.price,
      salePrice: product.salePrice || 0,
      title: product.name || product.title,
      image: product.image
    };
    
    console.log("Sending cart data:", cartData);
    
    // First add the item to cart
    console.log("Adding item to cart:", cartData);
    
    dispatch(addToCart(cartData))
      .then((result) => {
        console.log("Add to cart result:", result);
        
        if(result?.payload?.success){
          // Show appropriate message
          const isItemUpdated = result.payload?.itemUpdated;
          if (isItemUpdated) {
            toast.success('Cart updated successfully');
          } else {
            toast.success('Product added to cart');
          }
          
          // CRITICAL: Fetch fresh cart data to ensure the UI is updated correctly
          return dispatch(fetchCartItems(userId));
        } else {
          setIsLoading(false);
          toast.error('Failed to add product to cart');
          return Promise.reject('Failed to add to cart');
        }
      })
      .then((fetchResult) => {
        console.log("Cart fetch after adding item:", fetchResult);
        setIsLoading(false);
        
        // Important for commission tracking: ensure the cart is properly updated
        // before showing it to the user for checkout
        onClose();
        dispatch(openCart());
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error with cart operations:", error);
        toast.error('Error processing cart update');
      });
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-0 overflow-hidden rounded-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 rounded-full p-1.5 bg-white/80 backdrop-blur-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
        >
          <X size={18} />
        </button>
        
        {/* Product image as backdrop */}
        <div className="relative w-full">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/5 z-10"></div>
          <img 
            src={product.image} 
            alt={product.name || product.title} 
            className="w-full h-48 sm:h-56 object-cover"
          />
          
          {/* Product info overlay */}
          <div className="absolute bottom-0 left-0 w-full p-4 z-20 text-white">
            <h2 className="text-lg sm:text-xl font-bold">{product.name || product.title}</h2>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-white/90">{product.brand}</p>
              <div className="flex items-center gap-2">
                {product.salePrice > 0 && (
                  <p className="text-sm line-through text-white/70">GHS {product.price?.toFixed(2)}</p>
                )}
                <p className="font-bold text-base sm:text-lg">
                  GHS {(product.salePrice > 0 ? product.salePrice : product.price)?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 p-4 sm:p-6">

          <div className="space-y-3">
            <Label htmlFor="size" className="text-sm font-medium text-gray-700 flex items-center justify-between">
              <span>Select size</span>
              <button 
                type="button" 
                className="text-xs font-medium text-gray-600 hover:text-black"
              >
                Size chart
              </button>
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {sizes.map(size => {
                // Ensure size is capitalized
                const capitalizedSize = size.toUpperCase();
                return (
                  <motion.button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`
                      px-3 py-2.5 border text-sm font-medium transition-colors
                      ${selectedSize === size
                        ? 'border-black bg-white text-black'
                        : 'border-gray-300 bg-white text-black hover:border-gray-500'}
                    `}
                    whileTap={{ scale: 0.95 }}
                  >
                    {capitalizedSize}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="color" className="text-sm font-medium text-gray-700 flex items-center">
              <span>Select color</span>
            </Label>
            
            <div className="flex flex-wrap gap-4">
              {colors.map(color => {
                // Map color names to actual CSS color values - exact shades matching the image
                const colorMap = {
                  'white': '#FFFFFF',
                  'black': '#000000',
                  'gray': '#D3D3D3',  // Light gray as shown in the image
                  'blue': '#4E7AC7',  // Medium blue as shown in the image
                  'orange': '#FF8C42', // Vibrant orange as shown in the image
                  'purple': '#9370DB', // Medium purple as shown in the image
                  'pink': '#FFB6C1',  // Light pink as shown in the image
                  'red': '#FF0000',
                  'green': '#008000',
                  'yellow': '#FFFF00',
                  'brown': '#A52A2A',
                  'navy': '#000080',
                  'beige': '#F5F5DC',
                  'teal': '#008080',
                  'gold': '#FFD700',
                  'silver': '#C0C0C0',
                  'multicolor': 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
                };
                
                // Make the color name lowercase to match the colorMap keys
                const colorLower = color.toLowerCase();
                const bgColor = colorMap[colorLower] || '#CCCCCC';
                const isSelected = selectedColor === color;
                
                return (
                  <div className="flex flex-col items-center gap-1" key={color}>
                    <motion.button
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center justify-center ${isSelected ? '' : ''}`}
                      title={color}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Circle with border that changes when selected */}
                      <div 
                        className={`
                          w-10 h-10 rounded-full overflow-hidden 
                          ${isSelected ? 'border-2 border-white ring-1 ring-gray-300' : 'border border-gray-300'}
                        `}
                      >
                        <div 
                          className="w-full h-full"
                          style={{ background: bgColor }}
                        ></div>
                      </div>
                    </motion.button>
                    
                    {/* Always show color name, but bold when selected */}
                    <span className={`text-xs ${isSelected ? 'font-semibold' : 'text-gray-600'}`}>
                      {color.toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-start">
              <span className="text-sm font-medium">{selectedColor}</span>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
              Quantity
            </Label>
            <div className="flex items-center border border-gray-300 w-[120px] rounded">
              <motion.button 
                type="button"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                className="w-10 h-10 flex items-center justify-center border-r border-gray-300"
                whileTap={{ scale: 0.95 }}
                disabled={quantity <= 1}
              >
                <span className="text-xl">-</span>
              </motion.button>
              <div className="flex-1 h-10 flex items-center justify-center font-medium text-base">
                {quantity}
              </div>
              <motion.button 
                type="button"
                onClick={() => quantity < (product.totalStock || 10) && setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center border-l border-gray-300"
                whileTap={{ scale: 0.95 }}
                disabled={quantity >= (product.totalStock || 10)}
              >
                <span className="text-xl">+</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Fixed bottom actions */}
        <div className="sticky bottom-0 left-0 w-full bg-white border-t px-4 py-3 sm:px-6 sm:py-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              type="button"
              onClick={onClose}
              className="sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all font-medium hidden sm:flex items-center justify-center"
            >
              Cancel
            </button>
            <motion.button 
              type="button"
              onClick={handleAddToCart}
              className="w-full sm:flex-1 px-6 py-3 rounded-lg bg-black hover:bg-gray-800 text-white flex items-center justify-center gap-2 transition-all font-medium shadow-sm"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
              {isLoading ? 'Adding...' : 'Add to Cart'}
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductOptionsModal;
