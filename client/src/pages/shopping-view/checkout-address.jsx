import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PageTitle from '@/components/common/PageTitle';
import Address from '@/components/shopping-view/address';
import { MapPin, ArrowRight, ShoppingBag, Package } from 'lucide-react';

function CheckoutAddressSelection() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.shopCart);
  const { addressList } = useSelector(state => state.shopAddress);
  
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    // Check if user has items in cart
    if (!cartItems?.items || cartItems.items.length === 0) {
      toast.error('Your cart is empty', {
        description: 'Add items to your cart before proceeding to checkout'
      });
      navigate('/shop/listing');
      return;
    }

    // Check authentication
    if (!user || !user.id) {
      toast.error('Please sign in to continue', {
        description: 'Authentication required for checkout'
      });
      navigate('/auth/login');
      return;
    }

    setIsLoading(false);
  }, [cartItems, user, navigate]);

  useEffect(() => {
    // Auto-select single address or prompt for multiple
    if (addressList && addressList.length > 0 && !hasShownToast) {
      if (addressList.length === 1 && !selectedAddress) {
        const singleAddress = addressList[0];
        setSelectedAddress(singleAddress);
        toast.success('Address auto-selected', {
          description: `Using: ${singleAddress.city}, ${singleAddress.region}`
        });
        setHasShownToast(true);
      } else if (addressList.length > 1 && !selectedAddress) {
        toast.info('Please select your delivery address');
        setHasShownToast(true);
      }
    } else if (addressList && addressList.length === 0 && !hasShownToast) {
      toast.info('Please add a delivery address to continue');
      setHasShownToast(true);
    }
  }, [addressList, selectedAddress, hasShownToast]);

  const handleProceedToReview = () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }

    sessionStorage.setItem('checkoutSelectedAddress', JSON.stringify(selectedAddress));
    navigate('/shop/checkout/review');
  };

  // Calculate simple cart summary
  const cartSummary = cartItems?.items ? {
    itemCount: cartItems.items.length,
    subtotal: cartItems.items.reduce((total, item) => {
      const itemPrice = item.price || 0;
      return total + (itemPrice * item.quantity);
    }, 0)
  } : { itemCount: 0, subtotal: 0 };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageTitle title="Select Shipping Address - Checkout Step 1" />
      
      {/* Simplified Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Select Shipping Address</h1>
            
            {/* Simple Progress */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-full text-xs font-medium">1</span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-400 px-2.5 py-1">2</span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-400 px-2.5 py-1">3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Address Selection - Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-medium text-gray-900">Choose Delivery Address</h2>
                </div>
              </div>
              <div className="p-1">
                <Address 
                  selectedId={selectedAddress} 
                  setCurrentSelectedAddress={setSelectedAddress} 
                />
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Cart Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Compact Cart Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm border p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Order Summary</span>
                  </div>
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{cartSummary.itemCount} items</span>
                    <span className="font-medium">GHS {cartSummary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Shipping</span>
                    <span>Calculated next step</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Estimated Total</span>
                      <span>GHS {cartSummary.subtotal.toFixed(2)}+</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Selected Address Preview */}
              {selectedAddress && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm">
                      <p className="font-medium text-green-800">Selected Address</p>
                      <p className="text-green-700 mt-1">
                        {selectedAddress.customerName}<br />
                        {selectedAddress.city}, {selectedAddress.region}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <button
                  onClick={handleProceedToReview}
                  disabled={!selectedAddress}
                  className={`w-full py-3 px-4 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    selectedAddress
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Continue to Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/shop/cart')}
                  className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Cart
                </button>
              </motion.div>

              {/* Simple Trust Indicators */}
              <div className="text-xs text-gray-500 space-y-1 text-center">
                <p>🔒 Secure checkout</p>
                <p>📦 Free returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutAddressSelection; 