import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PageTitle from '@/components/common/PageTitle';
import PaystackPayment from '@/components/shopping-view/PaystackPayment';
import { MapPin, ShoppingBag, Truck, ArrowLeft, CreditCard, Shield } from 'lucide-react';
import img from '../../assets/account.jpg';

function CheckoutPayment() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.shopCart);
  
  const [checkoutData, setCheckoutData] = useState(null);
  const [showPaystack, setShowPaystack] = useState(false);
  const [isPaymentStart, setIsPaymentStart] = useState(false);
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

    // Get checkout data from session storage
    const storedCheckoutData = sessionStorage.getItem('checkoutData');
    if (!storedCheckoutData) {
      toast.error('Checkout session expired', {
        description: 'Please start checkout process again'
      });
      navigate('/shop/checkout/address');
      return;
    }

    try {
      const parsedCheckoutData = JSON.parse(storedCheckoutData);
      if (!parsedCheckoutData.selectedAddress) {
        toast.error('Invalid checkout data', {
          description: 'Please restart the checkout process'
        });
        navigate('/shop/checkout/address');
        return;
      }
      setCheckoutData(parsedCheckoutData);
    } catch (error) {
      toast.error('Invalid checkout session', {
        description: 'Please start checkout process again'
      });
      navigate('/shop/checkout/address');
      return;
    }

    setIsLoading(false);
  }, [cartItems, user, navigate]);

  const handleInitiatePayment = () => {
    setShowPaystack(true);
  };

  const handlePaymentSuccess = (reference) => {
    toast.success('Payment successful!', {
      description: 'Your order has been confirmed'
    });
    setIsPaymentStart(false);
    setShowPaystack(false);
    
    // Clear checkout session data
    sessionStorage.removeItem('checkoutSelectedAddress');
    sessionStorage.removeItem('checkoutData');
    
    // Redirect to order confirmation page
    window.location.href = `/shop/order-confirmation?reference=${reference}`;
  };

  const handlePaymentError = (error) => {
    toast.error('Payment failed', {
      description: error || 'Please try again later'
    });
    setIsPaymentStart(false);
    setShowPaystack(false);
  };

  const handleBackToReview = () => {
    navigate('/shop/checkout/review');
  };

  // Calculate totals
  const subtotal = cartItems?.items?.reduce((total, item) => {
    const itemPrice = item.price || 0;
    return total + (itemPrice * item.quantity);
  }, 0) || 0;

  const totalShippingFee = checkoutData?.totalShippingFee || 0;
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageTitle title="Complete Payment - Step 3 of 3" />
      
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
              Complete Payment
            </h1>
            <p className="text-sm sm:text-base mt-2 opacity-90">Step 3 of 3 - Secure checkout</p>
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
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="text-sm font-medium text-green-600">Review</span>
              </div>
              <div className="w-8 h-0.5 bg-green-500"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-sm font-medium text-indigo-600">Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-full">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">Delivery Address</h3>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-gray-900">{checkoutData?.selectedAddress?.customerName}</p>
                  <p className="text-gray-600">{checkoutData?.selectedAddress?.address}</p>
                  <p className="text-gray-600">{checkoutData?.selectedAddress?.city}, {checkoutData?.selectedAddress?.region}</p>
                  <p className="text-gray-600">{checkoutData?.selectedAddress?.phone}</p>
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">Order Summary</h3>
                    <p className="text-sm text-gray-500">{cartItems?.items?.length || 0} item{cartItems?.items?.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Truck className="h-4 w-4 mr-2 text-gray-400" />
                      Shipping
                    </span>
                    <span className="font-medium">{formatPrice(totalShippingFee)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-800">Total Amount</span>
                      <span className="font-bold text-xl text-gray-900">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Vendor Shipping Notice */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                      <div className="flex items-start">
                        <div className="p-1 bg-blue-100 text-blue-600 rounded-full mr-2 flex-shrink-0 mt-0.5">
                          <Truck size={12} />
                        </div>
                                                 <div>
                           <p className="font-medium text-blue-800 mb-1">Multi-Vendor Delivery</p>
                           <p className="text-blue-600">Orders from different vendors will be delivered separately. Each vendor handles their own shipping and delivery timeline.</p>
                           <a 
                             href="/shop/shipping" 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="text-blue-700 hover:text-blue-800 underline text-xs mt-1 inline-block"
                           >
                             Review shipping terms and conditions →
                           </a>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Delivery */}
                  {checkoutData?.estimatedDelivery && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center text-xs text-gray-500">
                        <Truck className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        <p>Estimated delivery: {checkoutData.estimatedDelivery.displayText} from payment confirmation</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Payment */}
          <div className="lg:col-span-3 space-y-6">
            <div className="max-w-md mx-auto lg:mx-0 space-y-6">
            {/* Payment Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">Payment Method</h3>
                    <p className="text-sm text-gray-500">Secure mobile money payment</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {showPaystack ? (
                  <div className="space-y-4">
                    <PaystackPayment 
                      amount={totalPrice} 
                      items={cartItems.items.map(item => ({
                        productId: item?.productId,
                        title: item?.title,
                        image: item?.image,
                        price: item?.salePrice > 0 ? item?.salePrice : item?.price,
                        quantity: item?.quantity,
                        size: item?.size,
                        color: item?.color,
                        adminId: item?.adminId || 'unknown'
                      }))}
                      shippingAddress={{
                        addressId: checkoutData?.selectedAddress?._id,
                        region: checkoutData?.selectedAddress?.region,
                        address: checkoutData?.selectedAddress?.address,
                        city: checkoutData?.selectedAddress?.city,
                        phone: checkoutData?.selectedAddress?.phone,
                        notes: checkoutData?.selectedAddress?.notes,
                      }}
                      shippingFees={checkoutData?.adminShippingFees || {}}
                      totalShippingFee={totalShippingFee}
                      estimatedDelivery={checkoutData?.estimatedDelivery}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                    <button 
                      onClick={() => setShowPaystack(false)}
                      className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel Payment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Payment Info */}
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure Payment</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Your payment is protected by industry-standard encryption. 
                        Pay securely with MTN Mobile Money, Vodafone Cash, or AirtelTigo Money.
                      </p>
                    </div>

                    {/* Payment Amount Display */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
                        <p className="text-3xl font-bold text-indigo-600">{formatPrice(totalPrice)}</p>
                      </div>
                    </div>

                    {/* Payment Button */}
                    <button 
                      onClick={handleInitiatePayment}
                      className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3"
                    >
                      {isPaymentStart ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={20} />
                          <span>Pay with Mobile Money</span>
                        </>
                      )}
                    </button>

                    {/* Security badges */}
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        SSL Secured
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="w-3 h-3 mr-1" />
                        PCI Compliant
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button
                onClick={handleBackToReview}
                className="w-full py-2.5 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Review
              </button>
            </motion.div>

                          {/* Help Text */}
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>🔒 256-bit SSL encryption</p>
                <p>📱 Support for all major mobile money networks</p>
                <p>💬 24/7 customer support available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPayment; 