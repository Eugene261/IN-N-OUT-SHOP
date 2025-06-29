import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PageTitle from '@/components/common/PageTitle';
import PaystackPayment from '@/components/shopping-view/PaystackPayment';
import { MapPin, ShoppingBag, Truck, ArrowLeft, CreditCard, Shield, Package } from 'lucide-react';

function CheckoutPayment() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.shopCart);
  
  const [checkoutData, setCheckoutData] = useState(null);
  const [showPaystack, setShowPaystack] = useState(false);
  const [isPaymentStart, setIsPaymentStart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validation checks
    if (!cartItems?.items || cartItems.items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/shop/listing');
      return;
    }

    if (!user || !user.id) {
      toast.error('Please sign in to continue');
      navigate('/auth/login');
      return;
    }

    // Get checkout data from session storage
    const storedCheckoutData = sessionStorage.getItem('checkoutData');
    if (!storedCheckoutData) {
      toast.error('Checkout session expired');
      navigate('/shop/checkout/address');
      return;
    }

    try {
      const parsedCheckoutData = JSON.parse(storedCheckoutData);
      if (!parsedCheckoutData.selectedAddress) {
        toast.error('Invalid checkout data');
        navigate('/shop/checkout/address');
        return;
      }
      setCheckoutData(parsedCheckoutData);
    } catch (error) {
      toast.error('Invalid checkout session');
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
    <div className="min-h-screen bg-gray-50">
      <PageTitle title="Complete Payment - Checkout Step 3" />
      
      {/* Simplified Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Complete Payment</h1>
            
            {/* Simple Progress */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-medium">✓</span>
              <span className="text-gray-400">→</span>
              <span className="bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-medium">✓</span>
              <span className="text-gray-400">→</span>
              <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-full text-xs font-medium">3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Section - Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-medium text-gray-900">Payment Method</h2>
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
                      className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel Payment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Payment Amount Display */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-indigo-600">{formatPrice(totalPrice)}</p>
                    </div>

                    {/* Payment Info */}
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
                        <Shield className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">Secure Mobile Money Payment</h3>
                      <p className="text-sm text-gray-600">
                        Pay with MTN Mobile Money, Vodafone Cash, or AirtelTigo Money
                      </p>
                    </div>

                    {/* Payment Button */}
                    <button 
                      onClick={handleInitiatePayment}
                      className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      {isPaymentStart ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Pay Now</span>
                        </>
                      )}
                    </button>

                    {/* Security info */}
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        SSL Secured
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        PCI Compliant
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Summary & Address */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm border p-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-medium text-gray-900">Final Summary</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items ({cartItems?.items?.length || 0})</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Shipping
                    </span>
                    <span className="font-medium">{formatPrice(totalShippingFee)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-lg text-indigo-600">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Shipping Address */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm border p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <h3 className="font-medium text-gray-900 text-sm">Delivery Address</h3>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">{checkoutData?.selectedAddress?.customerName}</p>
                  <p>{checkoutData?.selectedAddress?.city}, {checkoutData?.selectedAddress?.region}</p>
                  <p>{checkoutData?.selectedAddress?.phone}</p>
                </div>
              </motion.div>

              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <button
                  onClick={() => navigate('/shop/checkout/review')}
                  className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Review
                </button>
              </motion.div>

              {/* Trust Indicators */}
              <div className="text-xs text-gray-500 space-y-1 text-center">
                <p>🔒 Secure payment</p>
                <p>📱 All mobile networks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPayment; 