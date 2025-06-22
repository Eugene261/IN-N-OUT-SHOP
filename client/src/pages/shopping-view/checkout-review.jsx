import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PageTitle from '@/components/common/PageTitle';
import UserCartItemsContent from '@/components/shopping-view/cartItemsContent';
import { MapPin, ArrowRight, ArrowLeft, ShoppingBag, Truck, Store, Clock, Edit } from 'lucide-react';
import { calculateShippingFees } from '@/services/shippingService';
import img from '../../assets/account.jpg';

function CheckoutReview() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.shopCart);
  
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [adminShippingFees, setAdminShippingFees] = useState({});
  const [totalShippingFee, setTotalShippingFee] = useState(0);
  const [estimatedDelivery, setEstimatedDelivery] = useState(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    // Get selected address from session storage
    const storedAddress = sessionStorage.getItem('checkoutSelectedAddress');
    if (!storedAddress) {
      toast.error('No address selected', {
        description: 'Please select a shipping address first'
      });
      navigate('/shop/checkout/address');
      return;
    }

    try {
      const parsedAddress = JSON.parse(storedAddress);
      setSelectedAddress(parsedAddress);
    } catch (error) {
      toast.error('Invalid address data', {
        description: 'Please select a shipping address again'
      });
      navigate('/shop/checkout/address');
      return;
    }

    setIsLoading(false);
  }, [cartItems, user, navigate]);

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

  // Calculate shipping when address is available
  useEffect(() => {
    const calculateShipping = async () => {
      if (selectedAddress && cartItems && cartItems.items && cartItems.items.length > 0) {
        setIsCalculatingShipping(true);
        try {
          const cartItemsForShipping = cartItems.items.map(item => ({
            productId: item.productId,
            adminId: item.adminId || 'unknown',
            quantity: item.quantity,
            price: item.price,
            title: item.title,
            image: item.image
          }));
          
          const result = await calculateShippingFees(cartItemsForShipping, selectedAddress);
          
          if (result.success && result.data) {
            const formattedAdminShippingFees = {};
            
            if (result.data.adminShippingFees) {
              Object.keys(result.data.adminShippingFees).forEach(adminId => {
                const fee = result.data.adminShippingFees[adminId];
                
                if (typeof fee === 'object' && fee !== null) {
                  formattedAdminShippingFees[adminId] = fee;
                } else if (typeof fee === 'number') {
                  formattedAdminShippingFees[adminId] = { fee: fee };
                } else if (typeof fee === 'string') {
                  formattedAdminShippingFees[adminId] = { fee: parseFloat(fee) || 0 };
                } else {
                  formattedAdminShippingFees[adminId] = { fee: 0 };
                }
                
                if (result.data.shippingDetails && result.data.shippingDetails[adminId]) {
                  formattedAdminShippingFees[adminId].details = result.data.shippingDetails[adminId];
                }
              });
            }
            
            setAdminShippingFees(formattedAdminShippingFees);
            setTotalShippingFee(result.data.totalShippingFee || 0);
            
            if (result.data.estimatedDelivery) {
              setEstimatedDelivery(result.data.estimatedDelivery);
            }
          }
        } catch (error) {
          console.error('Error calculating shipping:', error);
          toast.error('Failed to calculate shipping', {
            description: 'Using default shipping rates'
          });
        } finally {
          setIsCalculatingShipping(false);
        }
      }
    };
    
    calculateShipping();
  }, [selectedAddress, cartItems]);

  const handleProceedToPayment = () => {
    // Store all checkout data for the payment step
    const checkoutData = {
      selectedAddress,
      adminShippingFees,
      totalShippingFee,
      estimatedDelivery
    };
    
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    navigate('/shop/checkout/payment');
  };

  const handleBackToAddress = () => {
    navigate('/shop/checkout/address');
  };

  const handleEditAddress = () => {
    navigate('/shop/checkout/address');
  };

  // Calculate totals
  const subtotal = cartItems?.items?.reduce((total, item) => {
    const itemPrice = item.price || 0;
    return total + (itemPrice * item.quantity);
  }, 0) || 0;

  const totalPrice = subtotal + totalShippingFee;

  // Format price
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'GHS 0.00';
    
    if (typeof price === 'object' && price !== null) {
      if (price.fee !== undefined) {
        return `GHS ${Number(price.fee).toFixed(2)}`;
      }
      return 'GHS 0.00';
    }
    
    return `GHS ${Number(price).toFixed(2)}`;
  };

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
      <PageTitle title="Review Your Order - Step 2 of 3" />
      
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
              Review Your Order
            </h1>
            <p className="text-sm sm:text-base mt-2 opacity-90">Step 2 of 3 - Confirm order details</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="text-sm font-medium text-green-600">Address</span>
              </div>
              <div className="w-8 h-0.5 bg-green-500"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-sm font-medium text-indigo-600">Review</span>
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
          {/* Left Column - Shipping Address */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Shipping Address</h3>
                      <p className="text-sm text-gray-500">Delivery location</p>
                    </div>
                  </div>
                  <button
                    onClick={handleEditAddress}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-md transition-colors"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{selectedAddress?.customerName}</p>
                  <p className="text-gray-600">{selectedAddress?.address}</p>
                  <p className="text-gray-600">{selectedAddress?.city}, {selectedAddress?.region}</p>
                  <p className="text-gray-600">{selectedAddress?.phone}</p>
                  {selectedAddress?.notes && (
                    <p className="text-sm text-gray-500 italic">Note: {selectedAddress.notes}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Combined Order Items & Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Order Items & Summary</h3>
                    <p className="text-sm text-gray-500">{cartItems?.items?.length || 0} item{cartItems?.items?.length !== 1 ? 's' : ''} • {formatPrice(totalPrice)} total</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Order Items */}
                <div className="space-y-6 mb-8">
                  {Object.keys(adminGroups).map((adminId) => (
                    <div key={adminId} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <Store className="h-4 w-4 text-blue-600 mr-2" />
                          <h4 className="font-medium text-gray-800">{adminGroups[adminId].adminName}</h4>
                        </div>
                        <div className="flex items-center text-sm">
                          <Truck className="h-3.5 w-3.5 text-blue-600 mr-1" />
                          <span className="text-blue-600 font-medium">
                            {isCalculatingShipping ? 'Calculating...' : formatPrice(adminShippingFees[adminId]?.fee || 0)} shipping
                          </span>
                        </div>
                      </div>
                      
                      <div className="divide-y divide-gray-100">
                        {adminGroups[adminId].items.map((item) => (
                          <div key={item.productId + (item.size || '') + (item.color || '')} className="p-4">
                            <UserCartItemsContent cartItem={item} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg border border-amber-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-amber-600" />
                    Order Summary
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-amber-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600 text-sm flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-gray-400" />
                          Total Shipping ({Object.keys(adminGroups).length} seller{Object.keys(adminGroups).length !== 1 ? 's' : ''})
                        </span>
                        <span className="font-medium text-sm">
                          {isCalculatingShipping ? 'Calculating...' : formatPrice(totalShippingFee)}
                        </span>
                      </div>
                      
                      {!isCalculatingShipping && Object.keys(adminShippingFees).length > 0 && (
                        <div className="ml-6 text-xs space-y-1 mt-1">
                          {Object.keys(adminShippingFees).map(adminId => (
                            <div key={adminId} className="flex justify-between text-gray-500">
                              <span>{adminGroups[adminId]?.adminName || 'Seller'}</span>
                              <span>{formatPrice(adminShippingFees[adminId]?.fee || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-amber-200 pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-800 text-lg">Total</span>
                        <span className="font-bold text-xl text-indigo-600">
                          {formatPrice(totalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Vendor Shipping Notice */}
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                        <div className="flex items-start">
                          <div className="p-1 bg-blue-100 text-blue-600 rounded-full mr-2 flex-shrink-0 mt-0.5">
                            <Truck size={12} />
                          </div>
                          <div>
                            <p className="font-medium text-blue-800 mb-1">Independent Vendor Shipping</p>
                            <p className="text-blue-600">Each vendor ships separately and charges their own shipping fee. You may receive multiple deliveries at different times.</p>
                            <a 
                              href="/shop/shipping" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-700 hover:text-blue-800 underline text-xs mt-1 inline-block"
                            >
                              View detailed shipping information →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    {estimatedDelivery && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <div className="flex items-start text-xs text-gray-600">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p>Estimated delivery: {estimatedDelivery.displayText} from payment confirmation</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Action Buttons */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-4"
              >
                <button
                  onClick={handleProceedToPayment}
                  disabled={isCalculatingShipping}
                  className={`w-full py-4 px-6 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-3 ${
                    isCalculatingShipping
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-[1.02]'
                  }`}
                >
                  {isCalculatingShipping ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Calculating Shipping...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Payment</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <button
                  onClick={handleBackToAddress}
                  className="w-full py-3 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back to Address
                </button>
              </motion.div>

              {/* Quick Summary Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 text-center">Quick Summary</h4>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{cartItems?.items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendors:</span>
                    <span className="font-medium">{Object.keys(adminGroups).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">{formatPrice(totalShippingFee)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-800">Total:</span>
                    <span className="font-bold text-indigo-600">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Security Notice */}
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>🔒 Your information is secure and encrypted</p>
                <p>📱 Payment via trusted mobile money providers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutReview; 