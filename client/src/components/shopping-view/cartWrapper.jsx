import { motion } from 'framer-motion';
import React from 'react';
import { SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import UserCartItemsContent from './cartItemsContent';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { closeCart } from '../../store/shop/cart-slice';

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
    
  return (
    <div className="flex flex-col h-full max-h-screen bg-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-6 border-b bg-white">
        <SheetHeader> 
          <SheetTitle className="text-xl font-semibold text-gray-900">Your Cart</SheetTitle>
        </SheetHeader>
      </div>
      
      {/* Scrollable cart items container */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 space-y-4">
          {validCartItems.length > 0 ? (
            validCartItems.map((item) => (
              <UserCartItemsContent 
                key={`${item.productId}-${item.size || 'default'}-${item.color || 'default'}`}
                cartItem={item}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🛒</div>
              <p className="text-lg font-medium mb-2">Your cart is empty</p>
              <p className="text-sm">Add some products to get started!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed bottom section with total and checkout button */}
      {validCartItems.length > 0 && (
        <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 bg-white">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className='text-lg font-semibold text-gray-900'>Total</span>
              <span className='text-xl font-bold text-gray-900'>GHS {totalPrice.toFixed(2)}</span>
            </div>
          </div>
          
          <motion.button 
            onClick={() => {
              navigate('/shop/checkout/address')
              dispatch(closeCart());
            }}
            className="w-full mt-4 py-3 px-6 bg-black text-white font-medium rounded-lg 
            hover:bg-gray-800 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Proceed to Checkout
          </motion.button>
        </div>
      )}
    </div>
  );
}

export default UserCartWraper;