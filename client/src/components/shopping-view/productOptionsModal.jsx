import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ShoppingBag } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, fetchCartItems, openCart } from '../../store/shop/cart-slice';
import { toast } from 'sonner';

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
      setSelectedSize('M');
      setSelectedColor('Black');
      setQuantity(1);
    }
  }, [isOpen, product]);

  // Available sizes and colors (these could be dynamic based on product)
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray'];

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to your cart");
      onClose();
      return;
    }

    // Log user information for debugging
    console.log("User info:", user);
    console.log("Product info:", product);
    
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
    
    const cartData = { 
      userId: userId, 
      productId: product._id, 
      quantity: quantity,
      size: selectedSize,
      color: selectedColor
    };
    
    console.log("Sending cart data:", cartData);
    
    dispatch(addToCart(cartData))
      .then((result) => {
        console.log("Add to cart result:", result);
        setIsLoading(false);
        
        if(result?.payload?.success){
          dispatch(fetchCartItems(userId));
          toast.success('Product added to cart');
          onClose();
          // Open the cart automatically when a product is added
          dispatch(openCart());
        } else {
          toast.error('Failed to add product to cart');
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error adding to cart:", error);
        toast.error('Error adding product to cart');
      });
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select Options</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-20 h-20 object-cover rounded-md"
            />
            <div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-gray-500 text-sm">{product.brand}</p>
              <p className="font-bold mt-1">GHS {product.price?.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size" className="text-sm font-medium">Size</Label>
            <RadioGroup 
              id="size" 
              value={selectedSize} 
              onValueChange={setSelectedSize}
              className="flex flex-wrap gap-2"
            >
              {sizes.map(size => (
                <div key={size} className="flex items-center">
                  <RadioGroupItem 
                    value={size} 
                    id={`size-${size}`} 
                    className="peer sr-only" 
                  />
                  <Label 
                    htmlFor={`size-${size}`}
                    className="px-3 py-1.5 border rounded-md text-sm cursor-pointer
                    peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white
                    peer-data-[state=checked]:border-black hover:bg-gray-100 transition-colors"
                  >
                    {size}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-medium">Color</Label>
            <RadioGroup 
              id="color" 
              value={selectedColor} 
              onValueChange={setSelectedColor}
              className="flex flex-wrap gap-2"
            >
              {colors.map(color => (
                <div key={color} className="flex items-center">
                  <RadioGroupItem 
                    value={color} 
                    id={`color-${color}`} 
                    className="peer sr-only" 
                  />
                  <Label 
                    htmlFor={`color-${color}`}
                    className="px-3 py-1.5 border rounded-md text-sm cursor-pointer
                    peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white
                    peer-data-[state=checked]:border-black hover:bg-gray-100 transition-colors"
                  >
                    {color}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                className="w-8 h-8 flex items-center justify-center border rounded-l-md"
              >
                -
              </button>
              <div className="w-12 h-8 flex items-center justify-center border-t border-b">
                {quantity}
              </div>
              <button 
                type="button"
                onClick={() => quantity < (product.totalStock || 10) && setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center border rounded-r-md"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button 
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleAddToCart}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-black hover:bg-gray-800 text-white flex items-center justify-center gap-2 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
            Add to Cart
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductOptionsModal;
