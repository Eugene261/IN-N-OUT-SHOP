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
  
  // Filter out any undefined or null items that might be causing issues
  const validCartItems = cartItems && cartItems.filter(item => item && item.productId);
  
  // Calculate total price from cart items
  const totalPrice = validCartItems && validCartItems.length > 0
    ? validCartItems.reduce((total, item) => {
        const itemPrice = item.salePrice || item.price || 0;
        return total + (itemPrice * item.quantity);
      }, 0)
    : 0;
    
  return (
    <SheetContent className='sm:max-w-md p-0 overflow-hidden'>
      <div className="flex flex-col h-full max-h-screen">
        <div className="p-6 border-b">
          <SheetHeader> 
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>
        </div>
        
        {/* Scrollable cart items container */}
        <div className="flex-1 overflow-y-auto py-4 px-6">
          <div className="space-y-4">
            {validCartItems && validCartItems.length > 0 ? (
              validCartItems.map((item) => (
                <UserCartItemsContent 
                  key={`${item.productId}-${item.size}-${item.color}`}
                  cartItem={item}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Your cart is empty
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed bottom section with total and checkout button */}
        {validCartItems && validCartItems.length > 0 && (
          <div className="p-6 pt-4 border-t border-gray-200 bg-white">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className='font-bold'>Total</span>
                <span className='font-bold'>GHS {totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <motion.button 
              onClick={() => {
                navigate('/shop/checkout')
                dispatch(closeCart());
              }}
              className="p-2 rounded-full w-full text-white mt-4 bg-black hover:bg-gray-800 
              transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Checkout
            </motion.button>
          </div>
        )}
      </div>
    </SheetContent>
  );
}

export default UserCartWraper;