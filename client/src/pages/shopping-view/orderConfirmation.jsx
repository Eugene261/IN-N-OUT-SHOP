import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import PageTitle from '@/components/common/PageTitle'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { verifyPayment } from '@/services/paystackService'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { clearCart, clearCartState, fetchCartItems } from '@/store/shop/cart-slice/index.js'
import axios from 'axios'
import { API_BASE_URL } from '@/config/api'

function OrderConfirmationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const [verificationStatus, setVerificationStatus] = useState('loading') // 'loading', 'success', 'failed'
  const [orderDetails, setOrderDetails] = useState(null)
  const [transactionId, setTransactionId] = useState('')

  // Use a flag to prevent multiple verifications
  const [hasVerified, setHasVerified] = useState(false);
  
  // Helper function to format shipping fee values - handles different data types
  const formatShippingFee = (fee) => {
    if (fee === undefined || fee === null) return '0.00';
    
    // Handle case where fee might be an object with a fee property
    if (typeof fee === 'object' && fee !== null) {
      if (fee.fee !== undefined && typeof fee.fee === 'number') {
        return fee.fee.toFixed(2);
      }
      return '0.00';
    }
    
    // Handle string values that can be converted to numbers
    if (typeof fee === 'string') {
      const numFee = parseFloat(fee);
      if (!isNaN(numFee)) {
        return numFee.toFixed(2);
      }
      return '0.00';
    }
    
    // Handle regular number values
    if (typeof fee === 'number') {
      return fee.toFixed(2);
    }
    
    return '0.00';
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const reference = params.get('reference')

    // Only run verification once
    if (reference && !hasVerified) {
      setHasVerified(true); // Set verification flag
      setTransactionId(reference)
      // First verify the payment with Paystack's API
      verifyPayment(reference)
        .then(paystackResponse => {
          if (paystackResponse.success && paystackResponse.data.status === 'success') {
            setVerificationStatus('success')
            setOrderDetails(paystackResponse.data)
            toast.success('Payment verified with Paystack!')
            
            // Now create the order in our database and clear the cart
            if (user && user.id) {
              try {
                console.log('Payment successful, creating order and clearing cart for user:', user.id);
                
                // First clear the cart state in Redux for immediate UI feedback
                dispatch(clearCartState());
                
                // Force cart to be empty in Redux store with the correct structure
                dispatch({ 
                  type: 'shopCart/fetchCartItems/fulfilled', 
                  payload: { data: { items: [] } }
                });
                
                // Set a flag to prevent cart fetching ON THE ORDER CONFIRMATION PAGE ONLY
                sessionStorage.setItem('cartEmptyAfterOrder', 'true');
                localStorage.setItem('cartEmptyAfterOrder', 'true');
                
                // Get the pending order data from localStorage
                const pendingOrderData = JSON.parse(localStorage.getItem('pendingOrderData') || '{}');
                const tempOrderId = localStorage.getItem('pendingOrderId');
                
                // If there's no pending order data, show error
                if (!pendingOrderData || Object.keys(pendingOrderData).length === 0) {
                  console.error('No pending order data found in localStorage');
                  toast.error('Order data not found. Please try again.');
                  setVerificationStatus('failed');
                  return;
                }
                
                // Update the order data with successful payment details
                const orderDataWithPayment = {
                  ...pendingOrderData,
                  paymentStatus: 'completed',
                  orderStatus: 'confirmed',
                  paymentId: reference,
                  paymentData: paystackResponse.data
                };
                
                console.log('Creating order with data:', orderDataWithPayment);
                
                // Ensure all data is properly formatted before sending to server
                const formattedOrderData = {
                  userId: orderDataWithPayment.userId || user?.id || '',
                  // Preserve customer name from original order data
                  customerName: orderDataWithPayment.customerName || user?.userName || user?.name || 'Customer',
                  cartItems: Array.isArray(orderDataWithPayment.cartItems) ? orderDataWithPayment.cartItems.map(item => ({
                    productId: item.productId || item._id || '',
                    title: item.title || item.productName || 'Product',
                    price: parseFloat(item.price) || 0,
                    quantity: parseInt(item.quantity, 10) || 1,
                    size: item.size || '',
                    color: item.color || '',
                    image: item.image || '',
                    adminId: item.adminId || item.vendorId || ''
                  })) : [],
                  // Preserve customer name in shipping address
                  addressInfo: {
                    ...(orderDataWithPayment.addressInfo || {}),
                    customerName: orderDataWithPayment.addressInfo?.customerName || 
                                  orderDataWithPayment.customerName || 
                                  user?.userName || 
                                  user?.name || 
                                  'Customer'
                  },
                  totalAmount: parseFloat(orderDataWithPayment.totalAmount) || 0,
                  shippingFee: parseFloat(orderDataWithPayment.shippingFee) || 0,
                  paymentMethod: orderDataWithPayment.paymentMethod || 'paystack',
                  paymentStatus: 'completed',
                  orderStatus: 'confirmed',
                  adminShippingFees: orderDataWithPayment.adminShippingFees || {}
                };
                
                // Create the order in the database now that payment is confirmed
                console.log('Attempting to create order with data:', {
                  orderItems: formattedOrderData.cartItems?.length || 0,
                  hasUserId: !!formattedOrderData.userId,
                  hasAddress: !!formattedOrderData.addressInfo,
                  totalAmount: formattedOrderData.totalAmount,
                  reference: reference
                });
                
                axios.post(`${API_BASE_URL}/api/shop/order/create-after-payment`, {
                  orderData: formattedOrderData,
                  reference: reference,
                  tempOrderId: tempOrderId || paystackResponse.data?.metadata?.tempOrderId
                }, {
                  headers: {
                    'Content-Type': 'application/json'
                  }
                })
                .then(serverResponse => {
                  console.log('Order verified and cart cleared on server:', serverResponse.data);
                  
                  // Store the order completion info in localStorage
                  const orderData = {
                    orderId: serverResponse.data?.data?._id || transactionId,
                    timestamp: new Date().getTime(),
                    cartCleared: true
                  };
                  localStorage.setItem('lastCompletedOrder', JSON.stringify(orderData));
                  
                  // Directly call the clear cart API to ensure database is updated
                  const userId = user.id || user._id;
                  dispatch(clearCart(userId))
                    .then(() => {
                      console.log('Cart cleared through Redux action');
                    })
                    .catch(error => {
                      console.error('Error clearing cart through Redux:', error);
                    });
                  
                  // After a delay, verify the cart is truly empty
                  setTimeout(() => {
                    axios.get(`${API_BASE_URL}/api/shop/cart/get/${user.id}`)
                      .then(cartResponse => {
                        console.log('Final cart verification:', cartResponse.data);
                        if (cartResponse.data?.data?.items?.length > 0) {
                          // If somehow items still exist, delete the cart directly
                          console.log('Items still found in cart, making final clear attempt');
                          axios.delete(`${API_BASE_URL}/api/shop/cart/clear/${user.id}`);
                        }
                      })
                      .catch(err => console.error('Error in final cart verification:', err));
                  }, 3000);
                })
                .catch(error => {
                  console.error('Error verifying order on server:', error);
                  toast.error('Failed to create order on server');
                  
                  // Try again with a retry - sometimes there might be a temporary network issue
                  setTimeout(() => {
                    console.log('Retrying order creation...');
                    toast.info('Retrying order creation...');
                    
                    // Use the formatted data for retry as well
                    axios.post(`${API_BASE_URL}/api/shop/order/create-after-payment`, {
                      orderData: formattedOrderData, // Use the formatted data instead of raw data
                      reference: reference,
                      tempOrderId: tempOrderId || paystackResponse.data?.metadata?.tempOrderId
                    }, {
                      headers: {
                        'Content-Type': 'application/json'
                      }
                    })
                    .then(retryResponse => {
                      console.log('Retry successful, order created:', retryResponse.data);
                      toast.success('Order created on retry!');
                      
                      // Update order data
                      const orderData = {
                        orderId: retryResponse.data?.data?._id || transactionId,
                        timestamp: new Date().getTime(),
                        cartCleared: true
                      };
                      localStorage.setItem('lastCompletedOrder', JSON.stringify(orderData));
                      
                      // Clear cart through Redux
                      const userId = user.id || user._id;
                      dispatch(clearCart(userId));
                    })
                    .catch(retryError => {
                      console.error('Final retry failed:', retryError);
                      toast.error('Order creation failed. Please contact support with your reference number.');
                      
                      // Save payment reference for support
                      localStorage.setItem('failedPaymentReference', reference);
                    });
                  }, 3000);
                  
                  // Even on error, ensure Redux state shows empty cart
                  dispatch(clearCartState());
                  
                  // As a fallback, try to clear the cart directly
                  axios.delete(`${API_BASE_URL}/api/shop/cart/clear/${user.id}`)
                    .catch(err => console.error('Error in fallback cart clearing:', err));
                });
              } catch (error) {
                console.error('Error in payment verification process:', error);
                // Ensure cart is cleared in Redux state even if API call fails
                dispatch(clearCartState());
              }
            } else {
              // If no user ID available, just clear the cart state
              dispatch(clearCartState());
            }
          } else {
            setVerificationStatus('failed')
            toast.error('Payment verification failed')
          }
        })
        .catch(error => {
          console.error('Payment verification error:', error)
          setVerificationStatus('failed')
          toast.error('Error verifying payment')
        })
    } else {
      // No reference found, might be a direct access
      setVerificationStatus('failed')
    }
    
    // Cleanup function - Clear any remaining cart flags when leaving the confirmation page
    return () => {
      sessionStorage.removeItem('cartEmptyAfterOrder');
      localStorage.removeItem('cartEmptyAfterOrder');
    };
  }, [location, dispatch, user])

  const checkmarkVariants = {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 }
  }

  const renderIcon = () => {
    if (verificationStatus === 'loading') {
      return (
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' }
          }}
        >
          <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
          <Loader className="w-20 h-20 text-blue-400 relative z-10" />
        </motion.div>
      )
    } else if (verificationStatus === 'success') {
      return (
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
          <CheckCircle className="w-20 h-20 text-emerald-400 relative z-10" />
        </motion.div>
      )
    } else {
      return (
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
          <XCircle className="w-20 h-20 text-red-400 relative z-10" />
        </motion.div>
      )
    }
  }

  const renderTitle = () => {
    if (verificationStatus === 'loading') {
      return 'Verifying Payment...'
    } else if (verificationStatus === 'success') {
      return 'Payment Confirmed'
    } else {
      return 'Payment Failed'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <PageTitle title={verificationStatus === 'success' ? 'Order Confirmed' : (verificationStatus === 'failed' ? 'Payment Failed' : 'Verifying Payment')} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20" />

          <CardHeader className="items-center text-center space-y-6">
            {renderIcon()}

            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {renderTitle()}
            </CardTitle>
          </CardHeader>

          <div className="p-6 pt-0 space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center space-y-2"
            >
              {verificationStatus === 'loading' && (
                <p className="text-gray-300 text-lg">
                  Please wait while we verify your payment...
                </p>
              )}

              {verificationStatus === 'success' && (
                <>
                  <p className="text-gray-300 text-lg">
                    Your order has been successfully processed
                  </p>
                  <p className="text-gray-400 text-sm">
                    Transaction ID: {transactionId || `#STP-${Math.floor(Math.random() * 1000000)}`}
                  </p>
                  {orderDetails && orderDetails.metadata && orderDetails.metadata.orderId && (
                    <p className="text-gray-400 text-sm">
                      Order ID: {orderDetails.metadata.orderId}
                    </p>
                  )}
                  
                  {/* Shipping Information Summary - Only shown if available in metadata */}
                  {orderDetails && orderDetails.metadata && orderDetails.metadata.shippingDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h3 className="text-left text-gray-200 font-medium mb-2">Shipping Details</h3>
                      <div className="bg-gray-800 rounded-lg p-3 text-left">
                        <div className="flex justify-between text-sm text-gray-300 mb-2">
                          <span>Delivery Address:</span>
                          <span className="text-right">{orderDetails.metadata.shippingDetails.address}</span>
                        </div>
                        
                        {/* Multi-vendor shipping breakdown */}
                        {orderDetails.metadata.shippingDetails.vendorShipping && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <h4 className="text-gray-300 text-xs mb-2">Shipping By Vendor:</h4>
                            <div className="space-y-1">
                              {Object.entries(orderDetails.metadata.shippingDetails.vendorShipping).map(([vendorId, details]) => (
                                <div key={vendorId} className="flex justify-between text-xs">
                                  <span className="text-gray-400">{details.vendorName || 'Vendor'}:</span>
                                  <span className="text-gray-300">GHS {formatShippingFee(details.fee)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between text-xs font-medium pt-1 border-t border-gray-700 mt-1">
                                <span className="text-gray-300">Total Shipping:</span>
                                <span className="text-gray-200">GHS {formatShippingFee(orderDetails.metadata.shippingDetails.totalFee)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between text-xs text-gray-400">
                          <span>Estimated Delivery:</span>
                          <span>{orderDetails.metadata.shippingDetails.estimatedDelivery || '3-5 business days'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {verificationStatus === 'failed' && (
                <>
                  <p className="text-gray-300 text-lg">
                    We couldn't verify your payment
                  </p>
                  <p className="text-gray-400 text-sm">
                    Please contact customer support if you believe this is an error
                  </p>
                </>
              )}
            </motion.div>

            <div className="space-y-4">
              {verificationStatus !== 'loading' && (
                <>
                  {verificationStatus === 'success' && (
                    <button
                      onClick={() => navigate('/shop/account/orders')}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      View Your Orders
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/shop/home')}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {verificationStatus === 'success' ? 'Continue Shopping' : 'Return to Shop'}
                  </button>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default OrderConfirmationPage