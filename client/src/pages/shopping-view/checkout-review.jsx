import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PageTitle from '@/components/common/PageTitle';
import { MapPin, ArrowRight, ArrowLeft, ShoppingBag, Truck, Store, Clock, Edit, Package } from 'lucide-react';
import { calculateShippingFees } from '@/services/shippingService';

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

    // Get selected address from session storage
    const storedAddress = sessionStorage.getItem('checkoutSelectedAddress');
    if (!storedAddress) {
      toast.error('Please select a shipping address first');
      navigate('/shop/checkout/address');
      return;
    }

    try {
      const parsedAddress = JSON.parse(storedAddress);
      setSelectedAddress(parsedAddress);
    } catch (error) {
      toast.error('Invalid address data');
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
      adminGroups[adminId].items.push(item);
      adminGroups[adminId].subtotal += itemPrice * item.quantity;
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
          toast.error('Failed to calculate shipping');
        } finally {
          setIsCalculatingShipping(false);
        }
      }
    };
    
    calculateShipping();
  }, [selectedAddress, cartItems]);

  const handleProceedToPayment = () => {
    const checkoutData = {
      selectedAddress,
      adminShippingFees,
      totalShippingFee,
      estimatedDelivery
    };
    
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    navigate('/shop/checkout/payment');
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
    <div className="min-h-screen bg-gray-50">
      <PageTitle title="Review Your Order - Checkout Step 2" />
      
      {/* Simplified Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Review Your Order</h1>
            
            {/* Simple Progress */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-medium">✓</span>
              <span className="text-gray-400">→</span>
              <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-full text-xs font-medium">2</span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-400 px-2.5 py-1">3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-gray-900">Shipping Address</h3>
                </div>
                <button
                  onClick={() => navigate('/shop/checkout/address')}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{selectedAddress?.customerName}</p>
                <p>{selectedAddress?.address}</p>
                <p>{selectedAddress?.city}, {selectedAddress?.region}</p>
                <p>{selectedAddress?.phone}</p>
              </div>
            </motion.div>

            {/* Order Items - Compact Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-medium text-gray-900">Order Items</h3>
                  <span className="text-sm text-gray-500">({cartItems?.items?.length || 0} items)</span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {Object.keys(adminGroups).map((adminId) => (
                  <div key={adminId} className="border border-gray-200 rounded-lg">
                    <div className="bg-blue-50 px-3 py-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{adminGroups[adminId].adminName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600">
                        <Truck className="w-3 h-3" />
                        <span className="text-xs">
                          {isCalculatingShipping ? 'Calculating...' : formatPrice(adminShippingFees[adminId]?.fee || 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-3 space-y-2">
                      {adminGroups[adminId].items.map((item) => (
                        <div key={item.productId + (item.size || '') + (item.color || '')} 
                             className="flex items-center gap-3 text-sm">
                          <img
                            src={item?.image || '/images/placeholder-product.png'}
                            alt={item?.title}
                            className="w-12 h-12 object-cover rounded-md bg-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{item?.title}</p>
                            <p className="text-gray-500 text-xs">
                              Qty: {item?.quantity} × GHS {(item?.price || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">GHS {((item?.price || 0) * item?.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Summary & Actions */}
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
                  <h3 className="font-medium text-gray-900">Order Summary</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Shipping
                    </span>
                    <span className="font-medium">
                      {isCalculatingShipping ? 'Calculating...' : formatPrice(totalShippingFee)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-lg text-indigo-600">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  {estimatedDelivery && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">Estimated Delivery</span>
                      </div>
                      <p className="text-blue-600 mt-1">{estimatedDelivery.displayText}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <button
                  onClick={handleProceedToPayment}
                  disabled={isCalculatingShipping}
                  className={`w-full py-3 px-4 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCalculatingShipping
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                  }`}
                >
                  {isCalculatingShipping ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate('/shop/checkout/address')}
                  className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Address
                </button>
              </motion.div>

              {/* Trust Indicators */}
              <div className="text-xs text-gray-500 space-y-1 text-center">
                <p>🔒 Secure payment</p>
                <p>📦 Multi-vendor shipping</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutReview; 