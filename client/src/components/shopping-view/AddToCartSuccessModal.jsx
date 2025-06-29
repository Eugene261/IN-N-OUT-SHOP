import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openCart } from '../../store/shop/cart-slice';

const AddToCartSuccessModal = ({ isOpen, onClose, product, quantity = 1 }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleContinueShopping = () => {
    onClose();
  };

  const handleProceedToCheckout = () => {
    onClose();
    navigate('/shop/checkout/address');
  };

  const handleViewCart = () => {
    onClose();
    dispatch(openCart());
  };

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <CheckCircle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Added to Cart!</h2>
                <p className="text-green-100">Item successfully added</p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={product.image} 
                  alt={product.title || product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {product.title || product.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Quantity: {quantity}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  GHS {product.price?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                onClick={handleProceedToCheckout}
                className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={handleViewCart}
                  className="py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingBag size={16} />
                  <span>View Cart</span>
                </motion.button>

                <motion.button
                  onClick={handleContinueShopping}
                  className="py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue Shopping
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddToCartSuccessModal; 