import { motion } from 'framer-motion';
import React from 'react';
import { SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import UserCartItemsContent from './cartItemsContent';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { closeCart } from '../../store/shop/cart-slice';
import { ShoppingBag, Plus, ArrowRight } from 'lucide-react';

function UserCartWraper({cartItems}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Debug cart items
  console.log('Cart items in wrapper:', cartItems);
  
  // Ensure cartItems is an array and filter out any invalid items
  // This is critical for multi-vendor platform where cart items originate from different vendors
  const validCartItems = Array.isArray(cartItems) 
    ? cartItems.filter(item => item && item.productId)
    : [];
    
  console.log('Valid cart items after filtering:', validCartItems);
  
  // Calculate total price from cart items with safeguards against NaN
  const totalPrice = validCartItems.length > 0
    ? validCartItems.reduce((total, item) => {
        // Ensure we have valid numeric values for price and quantity
        const itemPrice = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return total + (itemPrice * quantity);
      }, 0)
    : 0;

  const handleContinueShopping = () => {
    dispatch(closeCart());
    navigate('/shop/listing');
  };
    
  return (
    <div className="flex flex-col h-full max-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <SheetHeader> 
          <SheetTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart
            {validCartItems.length > 0 && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({validCartItems.length} {validCartItems.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
      </div>
      
      {/* Scrollable cart items container */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 space-y-4">
          {validCartItems.length > 0 ? (
            <>
              {validCartItems.map((item) => (
                <UserCartItemsContent 
                  key={`${item.productId}-${item.size || 'default'}-${item.color || 'default'}`}
                  cartItem={item}
                />
              ))}
              
              {/* Continue Shopping Button */}
              <motion.button
                onClick={handleContinueShopping}
                className="w-full mt-4 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                Continue Shopping
              </motion.button>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-6xl mb-4"
              >
                🛒
              </motion.div>
              <p className="text-lg font-medium mb-2">Your cart is empty</p>
              <p className="text-sm mb-4">Add some products to get started!</p>
              <motion.button
                onClick={handleContinueShopping}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Shopping
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed bottom section with total and checkout button */}
      {validCartItems.length > 0 && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className='text-lg font-semibold text-gray-900 dark:text-gray-100'>Total</span>
              <span className='text-xl font-bold text-gray-900 dark:text-gray-100'>GHS {totalPrice.toFixed(2)}</span>
            </div>
          </div>
          
          <motion.button 
            onClick={() => {
              navigate('/shop/checkout/address')
              dispatch(closeCart());
            }}
            className="w-full mt-4 py-3 px-6 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg 
            hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

export default UserCartWraper;