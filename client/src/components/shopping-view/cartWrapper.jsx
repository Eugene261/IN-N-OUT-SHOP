import { motion } from 'framer-motion';
import React from 'react';
import { SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import UserCartItemsContent from './cartItemsContent';
import { useNavigate } from 'react-router-dom';

function UserCartWraper({cartItems, setOpenCartSheet}) {
  const navigate = useNavigate();
  
  // Calculate total price from cart items
  const totalPrice = cartItems && cartItems.length > 0
    ? cartItems.reduce((total, item) => {
        const itemPrice = item.salePrice || item.price || 0;
        return total + (itemPrice * item.quantity);
      }, 0)
    : 0;
    
  return (
    <SheetContent className='sm:max-w-md flex flex-col h-full'>
      <SheetHeader> 
        <SheetTitle>Your Cart</SheetTitle>
      </SheetHeader>
      
      {/* Scrollable cart items container */}
      <div className="mt-8 flex-1 overflow-y-auto pr-2">
        <div className="space-y-4">
          {cartItems && cartItems.length > 0 ? (
            cartItems.map((item) => (
              <UserCartItemsContent 
                key={item.productId}
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
      {cartItems && cartItems.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className='font-bold'>Total</span>
              <span className='font-bold'>GHS {totalPrice.toFixed(2)}</span>
            </div>
          </div>
          
          <motion.button 
            onClick={() => {
              navigate('/shop/checkout')
              setOpenCartSheet(false);
            }}
            className="p-2 rounded-md w-full text-white mt-4 bg-black hover:bg-gray-700 
            transition-colors cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Checkout
          </motion.button>
        </div>
      )}
    </SheetContent>
  );
}

export default UserCartWraper;