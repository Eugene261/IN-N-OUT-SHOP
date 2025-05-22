import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import img from '../../assets/account.jpg'
import Address from '@/components/shopping-view/address';
import { useDispatch, useSelector } from 'react-redux';
import UserCartItemsContent from '@/components/shopping-view/cartItemsContent';
import { toast } from 'sonner';
import { createNewOrder } from '@/store/shop/order-slice';
import PaystackPayment from '@/components/shopping-view/PaystackPayment';
import { TruckIcon, Store, Package, Clock } from 'lucide-react';
import { calculateShippingFees } from '@/services/shippingService';

function ShoppingCheckout() {
  // Fix: Correctly destructure the user object from auth state
  const { user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.shopCart);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymentStart] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [adminShippingFees, setAdminShippingFees] = useState({});
  const [totalShippingFee, setTotalShippingFee] = useState(0);
  const [estimatedDelivery, setEstimatedDelivery] = useState(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const dispatch = useDispatch();

  // Group cart items by admin/seller
  const groupCartItemsByAdmin = () => {
    // If cart items don't exist, return empty object
    if (!cartItems || !cartItems.items || !cartItems.items.length) return {};

    const adminGroups = {};
    
    cartItems.items.forEach(item => {
      // Use adminId if available, or fallback to a placeholder
      // In a real implementation, we would fetch the admin ID for each product
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

  // Calculate shipping fee based on selected address for each admin group
  useEffect(() => {
    const calculateShipping = async () => {
      if (currentSelectedAddress && cartItems && cartItems.items && cartItems.items.length > 0) {
        setIsCalculatingShipping(true);
        try {
          // Format cart items for shipping calculation
          const cartItemsForShipping = cartItems.items.map(item => ({
            productId: item.productId,
            adminId: item.adminId || 'unknown',
            quantity: item.quantity,
            price: item.price,
            title: item.title,
            image: item.image
          }));
          
          // Call shipping service
          const result = await calculateShippingFees(cartItemsForShipping, currentSelectedAddress);
          
          if (result.success && result.data) {
            // Ensure adminShippingFees is properly formatted as an object with numeric values
            const formattedAdminShippingFees = {};
            
            if (result.data.adminShippingFees) {
              // Process each admin's shipping fee
              Object.keys(result.data.adminShippingFees).forEach(adminId => {
                const fee = result.data.adminShippingFees[adminId];
                
                // Handle different fee formats and ensure it's a proper object
                if (typeof fee === 'object' && fee !== null) {
                  formattedAdminShippingFees[adminId] = fee;
                } else if (typeof fee === 'number') {
                  formattedAdminShippingFees[adminId] = { fee: fee };
                } else if (typeof fee === 'string') {
                  formattedAdminShippingFees[adminId] = { fee: parseFloat(fee) || 0 };
                } else {
                  // Default case
                  formattedAdminShippingFees[adminId] = { fee: 0 };
                }
                
                // Add additional metadata if available
                if (result.data.shippingDetails && result.data.shippingDetails[adminId]) {
                  formattedAdminShippingFees[adminId].details = result.data.shippingDetails[adminId];
                }
              });
            }
            
            console.log('Formatted admin shipping fees:', formattedAdminShippingFees);
            setAdminShippingFees(formattedAdminShippingFees);
            setTotalShippingFee(result.data.totalShippingFee || 0);
            
            // Store estimated delivery info if available
            if (result.data.estimatedDelivery) {
              setEstimatedDelivery(result.data.estimatedDelivery);
            }
          } else {
            // If API call failed, use fallback calculation
            fallbackShippingCalculation();
          }
        } catch (error) {
          console.error('Error calculating shipping:', error);
          // Use fallback calculation if API call fails
          fallbackShippingCalculation();
        } finally {
          setIsCalculatingShipping(false);
        }
      } else {
        // Reset shipping fees if no address selected or no items in cart
        setAdminShippingFees({});
        setTotalShippingFee(0);
        setEstimatedDelivery(null);
      }
    };
    
    // Fallback calculation method if API fails
    const fallbackShippingCalculation = () => {
      // Group cart items by admin/seller
      const adminGroups = groupCartItemsByAdmin();
      
      // Calculate shipping fee based on location (simple zone-based)
      const city = (currentSelectedAddress.city || '').toLowerCase();
      const region = (currentSelectedAddress.region || '').toLowerCase();
      const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
      
      // Calculate shipping fee for each admin
      const fees = {};
      let total = 0;
      
      Object.keys(adminGroups).forEach(adminId => {
        // Check if location is Accra or Greater Accra
        const fee = isAccra ? 40 : 70; // GHS 40 for Accra/Greater Accra, GHS 70 for other regions
        fees[adminId] = fee;
        total += fee;
      });
      
      setAdminShippingFees(fees);
      setTotalShippingFee(total);
      
      // Set fallback estimated delivery
      setEstimatedDelivery({
        displayText: '3-5 business days',
        minDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        maxDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      });
    };
    
    calculateShipping();
  }, [currentSelectedAddress, cartItems]);

  const subtotal = cartItems && cartItems.items && cartItems.items.length > 0
    ? cartItems.items.reduce((total, item) => {
        const itemPrice = item.price || 0;
        return total + (itemPrice * item.quantity);
      }, 0)
    : 0;

  // Calculate total including shipping fee
  const totalPrice = subtotal + totalShippingFee;

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

  // Format price
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'GHS 0.00';
    
    // Handle case where price might be an object with a fee property (from new shipping structure)
    if (typeof price === 'object' && price !== null) {
      if (price.fee !== undefined) {
        return `GHS ${Number(price.fee).toFixed(2)}`;
      }
      // If it's an object but doesn't have a fee property, return 0
      return 'GHS 0.00';
    }
    
    // Ensure price is treated as a number
    return `GHS ${Number(price).toFixed(2)}`;
  };

  // Get admin groups for display
  const adminGroups = groupCartItemsByAdmin();

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
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full shadow-sm">
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
                {/* Cart Items List - Grouped by Admin/Seller */}
                <div className="space-y-6 mb-6">
                  {Object.keys(adminGroups).length > 0 ? (
                    Object.keys(adminGroups).map((adminId) => (
                      <div 
                        key={adminId}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <Store className="h-4 w-4 text-blue-600 mr-2" />
                            <h3 className="font-medium text-gray-800">{adminGroups[adminId].adminName}</h3>
                          </div>
                          {currentSelectedAddress && (
                            <div className="flex items-center text-sm">
                              <TruckIcon className="h-3.5 w-3.5 text-blue-600 mr-1" />
                              <span className="text-blue-600 font-medium">
                                {formatPrice(adminShippingFees[adminId] && adminShippingFees[adminId].fee ? adminShippingFees[adminId].fee : 0)} shipping
                              </span>
                              {adminShippingFees[adminId] && adminShippingFees[adminId].isSameRegion && (
                                <span className="inline-flex items-center text-green-600 ml-2 text-xs">
                                  <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                  </svg>
                                  Same region discount
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="divide-y divide-gray-100">
                          {adminGroups[adminId].items.map((item) => (
                            <div 
                              key={item.productId + (item.size || '') + (item.color || '')}
                              className="p-4 hover:bg-gray-50"
                            >
                              <UserCartItemsContent cartItem={item} />
                            </div>
                          ))}
                        </div>
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

                {Object.keys(adminGroups).length > 0 && (
                  <>
                    {/* Order Details */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="font-medium text-gray-700 mb-3">Price Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">{formatPrice(subtotal)}</span>
                        </div>
                        
                        {/* Shipping Fees Section - Itemized by seller */}
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex flex-col">
                              <span className="text-gray-600 flex items-center">
                                <TruckIcon className="h-4 w-4 mr-2 text-gray-400" /> 
                                Total Shipping ({Object.keys(adminGroups).length} {Object.keys(adminGroups).length === 1 ? 'seller' : 'sellers'})
                              </span>
                              <Link to="/shop/shipping" className="text-xs text-blue-500 hover:text-blue-700 mt-1 ml-6 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Learn about multi-vendor shipping
                              </Link>
                            </div>
                            <span className={`font-medium ${currentSelectedAddress ? '' : 'text-gray-400'}`}>
                              {currentSelectedAddress ? formatPrice(totalShippingFee) : 'Select address'}
                            </span>
                          </div>
                          
                          {currentSelectedAddress && Object.keys(adminShippingFees).length > 0 && (
                            <div className="ml-6 text-xs space-y-1 mt-1">
                              {Object.keys(adminShippingFees).map(adminId => {
                                // Check if we have detailed shipping info for this admin
                                const hasDetails = adminShippingFees.details && adminShippingFees.details[adminId];
                                const isSameRegion = hasDetails && adminShippingFees.details[adminId].isSameRegion;
                                const baseRegion = hasDetails ? adminShippingFees.details[adminId].baseRegion : null;
                                const customerRegion = hasDetails ? adminShippingFees.details[adminId].customerRegion : null;
                                
                                return (
                                  <div key={adminId}>
                                    <div className="flex justify-between text-gray-500">
                                      <span>
                                        {adminGroups[adminId]?.adminName || 'Seller'}
                                        {isSameRegion && (
                                          <span className="inline-flex items-center ml-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded-sm text-[10px]">
                                            <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                            Discounted
                                          </span>
                                        )}
                                      </span>
                                      <span>{formatPrice(adminShippingFees[adminId] && adminShippingFees[adminId].fee ? adminShippingFees[adminId].fee : 0)}</span>
                                    </div>
                                    {hasDetails && baseRegion && (
                                      <div className="ml-4 text-[10px] text-gray-400 mt-0.5">
                                        {isSameRegion ? (
                                          <span>Based in your region ({baseRegion})</span>
                                        ) : (
                                          <span>Ships from {baseRegion} to {customerRegion || 'your location'}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="border-t border-gray-200 my-2 pt-2 flex justify-between">
                          <span className="font-semibold text-gray-800">Total</span>
                          <span className="font-bold text-xl text-gray-900">
                            {formatPrice(totalPrice)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Shipping information note */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {isCalculatingShipping && (
                          <div className="text-xs text-gray-500 flex items-center mb-2">
                            <svg className="animate-spin mr-1.5 h-3 w-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Calculating shipping fees...
                          </div>
                        )}
                        
                        {estimatedDelivery && (
                          <div className="flex items-start text-xs text-gray-500 mb-2">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <p>
                              Estimated delivery: {estimatedDelivery.displayText} from payment confirmation
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-start text-xs text-gray-500">
                          <TruckIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <p>
                            Shipping fees are calculated based on your location, order weight, and value.
                            Each seller ships separately and charges their own shipping fee.
                            Sellers based in your region may offer discounted shipping rates.
                            <a href="/shop/shipping" className="text-indigo-600 hover:text-indigo-800 ml-1 whitespace-nowrap">
                              View shipping details
                            </a>
                          </p>
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
                            color: item?.color,
                            adminId: item?.adminId || 'unknown'
                          }))}
                          shippingAddress={{
                            addressId: currentSelectedAddress?._id,
                            region: currentSelectedAddress?.region,
                            address: currentSelectedAddress?.address,
                            city: currentSelectedAddress?.city,
                            phone: currentSelectedAddress?.phone,
                            notes: currentSelectedAddress?.notes,
                          }}
                          shippingFees={adminShippingFees}
                          totalShippingFee={totalShippingFee}
                          estimatedDelivery={estimatedDelivery}
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
                      <>
                        <button 
                          onClick={handleInitiatePaystackPayment}
                          className={`w-full py-3.5 px-6 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${!user || cartItems?.items?.length === 0 || !currentSelectedAddress
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-[1.01]'}`}
                          disabled={!user || cartItems?.items?.length === 0 || !currentSelectedAddress}
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
                        
                        {!currentSelectedAddress && cartItems?.items?.length > 0 && (
                          <div className="mt-2 text-center">
                            <p className="text-amber-600 text-sm font-medium animate-pulse">
                              Please select a shipping address to continue
                            </p>
                          </div>
                        )}
                      </>
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