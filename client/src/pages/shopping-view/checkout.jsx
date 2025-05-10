import React, { useState } from 'react'
import img from '../../assets/account.jpg'
import Address from '@/components/shopping-view/address';
import { useDispatch, useSelector } from 'react-redux';
import UserCartItemsContent from '@/components/shopping-view/cartItemsContent';
import { toast } from 'sonner';
import { createNewOrder } from '@/store/shop/order-slice';
import PaystackPayment from '@/components/shopping-view/PaystackPayment';

function ShoppingCheckout() {
  // Fix: Correctly destructure the user object from auth state
  const { user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.shopCart);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymentStart] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const dispatch = useDispatch();

  console.log(currentSelectedAddress, "currentSelectedAddress");

  const totalPrice = cartItems && cartItems.items && cartItems.items.length > 0
    ? cartItems.items.reduce((total, item) => {
        const itemPrice = item.salePrice || item.price || 0;
        return total + (itemPrice * item.quantity);
      }, 0)
    : 0;

  function handleInitiatePaystackPayment() {
    // Check if an address is selected
    if (!currentSelectedAddress) {
      toast.error('Please select an address before checkout', {
        description: 'You need to select a shipping address to continue'
      });
      return;
    }

    // Check if cart has items
    if(!cartItems?.items || cartItems.items.length === 0){
      toast.error('Please add items to your cart before checkout', {
        description: 'You need to add an item or more to your cart to continue'
      });
      return;
    }
    
    // Check if user is authenticated
    if (!user || !user.id) {
      toast.error('Authentication required', {
        description: 'Please sign in to complete your purchase'
      });
      return;
    }

    // Show Paystack payment component
    setShowPaystack(true);
  };
  
  const handlePaymentSuccess = (reference) => {
    toast.success('Payment successful!', {
      description: 'Your order has been confirmed'
    });
    setIsPaymentStart(false);
    setShowPaystack(false);
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

  // No need for approvalURL redirect with Paystack

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-48 sm:h-60 overflow-hidden bg-gray-900">
        <img
          src={img}
          className="h-full w-full object-cover object-center opacity-75"
          alt="Checkout header"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide">
            Checkout
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Address */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Shipping Information
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Select or add a delivery address</p>
                  </div>
                </div>
              </div>
              <div className="p-1">
                <Address selectedId={currentSelectedAddress} setCurrentSelectedAddress={setCurrentSelectedAddress} />
              </div>
            </div>
          </div>

          {/* Right Column - Cart Items */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Order Summary
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Review your items before checkout</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Cart Items List */}
                <div className="space-y-4 mb-6">
                  {cartItems?.items?.length > 0 ? (
                    cartItems.items.map((item) => (
                      <div 
                        key={item.title}
                        className="p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200 bg-white"
                      >
                        <UserCartItemsContent cartItem={item} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                      <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">
                        Your cart is empty
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Add items to your cart to proceed with checkout
                      </p>
                    </div>
                  )}
                </div>

                {cartItems?.items?.length > 0 && (
                  <>
                    {/* Order Details */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="font-medium text-gray-700 mb-3">Order Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">GHS {totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-medium">GHS 0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">GHS 0.00</span>
                        </div>
                        <div className="border-t border-gray-200 my-2 pt-2 flex justify-between">
                          <span className="font-semibold text-gray-800">Total</span>
                          <span className="font-bold text-xl text-gray-900">
                            GHS {totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {showPaystack ? (
                      <div className="mt-4">
                        <PaystackPayment 
                          amount={totalPrice} 
                          items={cartItems.items.map(item => ({
                            productId: item?.productId,
                            title: item?.title,
                            image: item?.image,
                            price: item?.salePrice > 0 ? item?.salePrice : item?.price,
                            quantity: item?.quantity,
                            size: item?.size,
                            color: item?.color
                          }))}
                          shippingAddress={{
                            addressId: currentSelectedAddress?._id,
                            region: currentSelectedAddress?.region,
                            address: currentSelectedAddress?.address,
                            city: currentSelectedAddress?.city,
                            phone: currentSelectedAddress?.phone,
                            notes: currentSelectedAddress?.notes,
                          }}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                        <button 
                          onClick={() => setShowPaystack(false)}
                          className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel Payment
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleInitiatePaystackPayment}
                        className={`w-full py-3.5 px-6 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${!user || cartItems?.items?.length === 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-[1.01]'}`}
                        disabled={!user || cartItems?.items?.length === 0}
                      >
                        {isPaymentStart ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Pay with Mobile Money
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShoppingCheckout;