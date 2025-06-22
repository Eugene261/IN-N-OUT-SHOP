import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PageTitle from '@/components/common/PageTitle';
import Address from '@/components/shopping-view/address';
import UserCartItemsContent from '@/components/shopping-view/cartItemsContent';
import { MapPin, ArrowRight, ShoppingBag, Truck, Store } from 'lucide-react';
import img from '../../assets/account.jpg';

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
    // Only show toasts once per session
    if (addressList && addressList.length > 0 && !hasShownToast) {
      if (addressList.length === 1 && !selectedAddress) {
        const singleAddress = addressList[0];
        setSelectedAddress(singleAddress);
        toast.success('Address auto-selected', {
          description: `Using your saved address: ${singleAddress.city}, ${singleAddress.region}`
        });
        setHasShownToast(true);
      } else if (addressList.length > 1 && !selectedAddress) {
        toast.info('Multiple addresses found', {
          description: 'Please select your preferred delivery address'
        });
        setHasShownToast(true);
      }
    } else if (addressList && addressList.length === 0 && !hasShownToast) {
      toast.info('No addresses found', {
        description: 'Please add a delivery address to continue'
      });
      setHasShownToast(true);
    }
  }, [addressList, selectedAddress, hasShownToast]);

  const handleProceedToReview = () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address', {
        description: 'You need to choose where your order should be delivered'
      });
      return;
    }

    // Store selected address in session storage for the checkout flow
    sessionStorage.setItem('checkoutSelectedAddress', JSON.stringify(selectedAddress));
    
    // Navigate to order review page
    navigate('/shop/checkout/review');
  };

  const handleBackToCart = () => {
    navigate('/shop/cart');
  };

  // Group cart items by admin/seller
  const groupCartItemsByAdmin = () => {
    if (!cartItems || !cartItems.items || !cartItems.items.length) return {};

    const adminGroups = {};
    
    cartItems.items.forEach(item => {
      const adminId = item.adminId || 'unknown';
      const adminName = item.adminName || 'Shop Seller';
      
      if (!adminGroups[adminId]) {
        adminGroups[adminId] = {
          items: [],
          adminName,
          subtotal: 0
        };
      }
      
      const itemPrice = item.salePrice || item.price || 0;
      const itemTotal = itemPrice * item.quantity;
      
      adminGroups[adminId].items.push(item);
      adminGroups[adminId].subtotal += itemTotal;
    });
    
    return adminGroups;
  };

  // Calculate cart summary
  const cartSummary = cartItems?.items ? {
    itemCount: cartItems.items.length,
    subtotal: cartItems.items.reduce((total, item) => {
      const itemPrice = item.price || 0;
      return total + (itemPrice * item.quantity);
    }, 0)
  } : { itemCount: 0, subtotal: 0 };

  const adminGroups = groupCartItemsByAdmin();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageTitle title="Select Shipping Address - Step 1 of 3" />
      
      {/* Hero Section */}
      <div className="relative h-32 sm:h-40 overflow-hidden bg-gray-900">
        <img
          src={img}
          className="h-full w-full object-cover object-center opacity-75"
          alt="Checkout"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="text-center text-white">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
              Select Shipping Address
            </h1>
            <p className="text-sm sm:text-base mt-2 opacity-90">Step 1 of 3 - Choose delivery location</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="text-sm font-medium text-indigo-600">Address</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-sm text-gray-500">Review</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-sm text-gray-500">Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Address Selection */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Address 
                selectedId={selectedAddress} 
                setCurrentSelectedAddress={setSelectedAddress} 
              />
            </motion.div>
          </div>

          {/* Right Column - Order Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Cart Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
                      <p className="text-sm text-gray-500">{cartSummary.itemCount} item{cartSummary.itemCount !== 1 ? 's' : ''} in cart</p>
                    </div>
                  </div>
                </div>
                
                                <div className="p-6">
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {Object.keys(adminGroups).length > 0 ? (
                      Object.keys(adminGroups).map((adminId) => (
                        <div key={adminId} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-blue-50 px-3 py-2 flex items-center">
                            <Store className="h-3 w-3 text-blue-600 mr-2" />
                            <h4 className="font-medium text-gray-800 text-sm">{adminGroups[adminId].adminName}</h4>
                          </div>
                          
                          <div className="divide-y divide-gray-100">
                            {adminGroups[adminId].items.map((item) => (
                              <div key={item.productId + (item.size || '') + (item.color || '')} className="p-3">
                                <UserCartItemsContent cartItem={item} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Your cart is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">GHS {cartSummary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Truck size={16} className="mr-1" />
                        Shipping
                      </span>
                      <span className="text-gray-500">Calculated next step</span>
                    </div>
                    
                    {/* Vendor shipping info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                      <div className="flex items-start">
                        <div className="p-1 bg-blue-100 text-blue-600 rounded-full mr-2 flex-shrink-0 mt-0.5">
                          <Truck size={12} />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800 mb-1">Multi-Vendor Shipping</p>
                          <p className="text-blue-600">Each vendor in your cart ships independently and charges their own shipping fee. Final shipping costs will be calculated based on your delivery address.</p>
                          <a 
                            href="/shop/shipping" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-800 underline text-xs mt-1 inline-block"
                          >
                            Learn more about shipping policies →
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-800">Estimated Total</span>
                        <span className="font-bold text-lg text-gray-900">GHS {cartSummary.subtotal.toFixed(2)}+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Selected Address Preview */}
              {selectedAddress && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-full">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Selected Address</h3>
                        <p className="text-sm text-gray-500">Delivery location confirmed</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">{selectedAddress.customerName}</p>
                      <p className="text-gray-600">{selectedAddress.address}</p>
                      <p className="text-gray-600">{selectedAddress.city}, {selectedAddress.region}</p>
                      <p className="text-gray-600">{selectedAddress.phone}</p>
                      {selectedAddress.notes && (
                        <p className="text-sm text-gray-500 italic">Note: {selectedAddress.notes}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-3"
              >
                <button
                  onClick={handleProceedToReview}
                  disabled={!selectedAddress}
                  className={`w-full py-3.5 px-6 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-3 ${
                    selectedAddress
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-[1.02]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Continue to Review</span>
                  <ArrowRight size={20} />
                </button>

                <button
                  onClick={handleBackToCart}
                  className="w-full py-2.5 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Back to Cart
                </button>
              </motion.div>

              {/* Help Text */}
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>🔒 Your information is secure and encrypted</p>
                <p>✓ Free cancellation within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutAddressSelection; 