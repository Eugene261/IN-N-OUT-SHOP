import { deleteCartItem, updateCartQuantity } from '@/store/shop/cart-slice';
import { Minus, Plus, Trash } from 'lucide-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
};

const buttonHover = {
  scale: 1.05,
  transition: { type: "spring", stiffness: 400, damping: 10 }
};

const buttonTap = {
  scale: 0.95,
  transition: { type: "spring", stiffness: 400, damping: 10 }
};

function UserCartItemsContent({ cartItem }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.shopCart);
  const { productList } = useSelector(state => state.shopProducts);

  // Function to get color code from color name
  function getColorCode(colorName) {
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
    
    return colorMap[colorName] || '#CCCCCC';
  }

  function handleCartItemDelete(getCartItem) {
    // Ensure user is authenticated
    if (!user || !user.id) {
      toast.error('Please login to manage your cart', {
        position: 'top-center',
        duration: 2000
      });
      return;
    }
    
    dispatch(deleteCartItem({ 
      userId: user.id, 
      productId: getCartItem.productId,
      size: getCartItem.size,
      color: getCartItem.color
    }))
    .unwrap()
    .then((data) => {
      if (data.success) {
        toast.success('Item removed', {
          position: 'top-center',
          duration: 2000,
          style: {
            background: '#000',
            color: '#fff',
            border: '1px solid #333'
          }
        });
      } else {
        toast.error(data.message || 'Failed to remove item', {
          position: 'top-center',
          duration: 2000
        });
      }
    })
    .catch((error) => {
      console.error('Error removing item from cart:', error);
      toast.error(error.message || 'Failed to remove item', {
        position: 'top-center',
        duration: 2000
      });
    });
  }

  function handleUpdateQuantity(getCartItem, typeOfAction) {
    // Ensure user is authenticated
    if (!user || !user.id) {
      toast.error('Please login to manage your cart', {
        position: 'top-center',
        duration: 2000
      });
      return;
    }
    
    // Only perform these checks when increasing quantity
    if (typeOfAction === 'plus') {
      const getCartItems = cartItems.items || [];
      
      if (getCartItems.length) {
        // Find the product in the product list
        const currentProduct = productList?.find(product => product._id === getCartItem?.productId);
        
        // Check if product exists and has totalStock property
        if (!currentProduct) {
          toast.error('Product information not available', {
            position: 'top-center',
            duration: 2000
          });
          return;
        }
        
        const getTotalStock = currentProduct.totalStock || 0;
        
        // Find the current cart item
        const indexOfCurrentCartItem = getCartItems.findIndex(item => 
          item.productId === getCartItem?.productId &&
          item.size === getCartItem?.size &&
          item.color === getCartItem?.color
        );
        
        if (indexOfCurrentCartItem > -1) {
          const getQuantity = getCartItems[indexOfCurrentCartItem].quantity;
          
          // Check if current quantity would exceed total stock
          if (getQuantity >= getTotalStock) {
            toast.error(
              <div className="flex flex-col gap-1">
                <span className="font-bold">Stock limit reached!</span>
                <span>Only {getTotalStock} items available in stock.</span>
                <span className="text-xs">You cannot add more of this item to your cart.</span>
              </div>, 
              {
                position: 'top-center',
                duration: 3000
              }
            );
            return;
          }
          
          // Check if we're approaching stock limit
          if (getQuantity + 1 === getTotalStock) {
            toast.warning(
              <div className="flex flex-col gap-1">
                <span className="font-bold">Last item in stock!</span>
                <span>You've reached the maximum available quantity for this product.</span>
              </div>,
              {
                position: 'top-center',
                duration: 3000
              }
            );
          }
        }
      }
    }

    // Don't allow decreasing below 1
    if (typeOfAction === 'minus' && getCartItem?.quantity <= 1) {
      return;
    }

    const newQuantity = typeOfAction === 'plus' ? 
      getCartItem?.quantity + 1 : getCartItem?.quantity - 1;
      
    dispatch(updateCartQuantity({
      userId: user.id,
      productId: getCartItem?.productId,
      quantity: newQuantity,
      size: getCartItem?.size,
      color: getCartItem?.color
    }))
    .unwrap()
    .then((data) => {
      if (data.success) {
        toast(`Quantity updated to ${newQuantity}`, {
          position: 'top-center',
          duration: 1500,
          style: {
            background: '#000',
            color: '#fff',
            border: '1px solid #333'
          }
        });
      } else {
        toast.error(data.message || 'Failed to update quantity', {
          position: 'top-center',
          duration: 2000
        });
      }
    })
    .catch((error) => {
      console.error('Error updating cart quantity:', error);
      toast.error(error.message || 'Failed to update quantity', {
        position: 'top-center',
        duration: 2000
      });
    });
  }

  return (
    <motion.div
      className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -2 }}
      layout
    >
      <div className="flex items-center space-x-4">
        <motion.div 
          className="relative overflow-hidden rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <img
            src={cartItem?.image}
            alt={cartItem?.title}
            className="w-20 h-20 object-cover rounded-lg bg-gray-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="font-medium text-gray-900">{cartItem?.title}</h2>
          
          {/* Display size and color information */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Size:</span>
              <span className="text-xs font-medium">{cartItem?.size || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Color:</span>
              <span className="text-xs font-medium">{cartItem?.color || 'N/A'}</span>
              {cartItem?.color && (
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300" 
                  style={{
                    background: getColorCode(cartItem?.color),
                    display: 'inline-block'
                  }}
                ></div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => handleUpdateQuantity(cartItem, 'minus')}
              className="h-8 w-8 rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300 disabled:opacity-40"
              disabled={cartItem?.quantity === 1}
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <Minus className="w-3 h-3 text-gray-700" />
            </motion.button>
            
            <motion.span 
              className="font-medium w-6 text-center"
              key={cartItem.quantity}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              {cartItem?.quantity}
            </motion.span>
            
            <motion.button
              onClick={() => handleUpdateQuantity(cartItem, 'plus')}
              className="h-8 w-8 rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <Plus className="w-3 h-3 text-gray-700" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end space-y-3">
        <p className="font-semibold text-gray-900">
          GHS{((cartItem?.salePrice > 0 ? cartItem?.salePrice : cartItem?.price) * cartItem.quantity).toFixed(2)}
        </p>
        
        <motion.button
          onClick={() => handleCartItemDelete(cartItem)}
          className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          whileHover={buttonHover}
          whileTap={buttonTap}
        >
          <Trash className="text-gray-600" size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default UserCartItemsContent;