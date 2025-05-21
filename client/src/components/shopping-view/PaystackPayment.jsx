import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { initializePayment, verifyPayment } from '../../services/paystackService';
import { createNewOrder } from '../../store/shop/order-slice';
import { PAYSTACK_PUBLIC_KEY, MOBILE_MONEY_NETWORKS } from '../../config/paystack';
import { TruckIcon, Store } from 'lucide-react';

const PaystackPayment = ({ amount, items, shippingAddress, shippingFees = {}, totalShippingFee = 0, onSuccess, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [mobileNetwork, setMobileNetwork] = useState('mtn');
  const [mobileNumber, setMobileNumber] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  // Using networks from config file
  const networks = MOBILE_MONEY_NETWORKS;

  // Calculate subtotal from total amount and shipping fee
  useEffect(() => {
    setSubtotal(amount - totalShippingFee);
  }, [amount, totalShippingFee]);

  // Group items by admin
  const groupItemsByAdmin = () => {
    const adminGroups = {};
    
    items.forEach(item => {
      const adminId = item.adminId || 'unknown';
      
      if (!adminGroups[adminId]) {
        adminGroups[adminId] = {
          items: [],
          shippingFee: shippingFees[adminId] || 0
        };
      }
      
      adminGroups[adminId].items.push(item);
    });
    
    return adminGroups;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!mobileNumber && paymentMethod === 'mobile_money') {
      toast.error('Please enter your mobile number');
      return;
    }
    
    if (mobileNumber && paymentMethod === 'mobile_money' && mobileNumber.length < 10) {
      toast.error('Please enter a valid mobile number');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Group items by admin
      const adminGroups = groupItemsByAdmin();
      
      // Create an order with shipping fees per admin
      const orderAction = await dispatch(createNewOrder({
        userId: user.id,
        cartItems: items,
        addressInfo: shippingAddress,
        totalAmount: amount,
        shippingFee: totalShippingFee, // Total shipping fee
        adminShippingFees: shippingFees, // Keep the per-admin shipping fees
        paymentMethod: 'paystack',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        orderDate: new Date(),
        orderUpdateDate: new Date(),
        // Add admin groups information for order processing
        adminGroups: Object.keys(adminGroups).map(adminId => ({
          adminId,
          items: adminGroups[adminId].items.map(item => item.productId),
          shippingFee: adminGroups[adminId].shippingFee
        }))
      }));
      
      if (createNewOrder.fulfilled.match(orderAction) && orderAction.payload.success) {
        // Extract orderId safely, with fallback
        const orderId = orderAction.payload.data?._id || 
                       orderAction.payload.orderId || 
                       orderAction.payload._id || 
                       `order-${Date.now()}`; // Fallback to timestamp if no ID found
        
        console.log('Order created with response:', orderAction.payload);
        
        // Initialize Paystack payment
        const paymentData = {
          amount: parseFloat(amount.toFixed(2)), // Ensure amount is a clean number
          email: user.email,
          callbackUrl: `${window.location.origin}/shop/order-confirmation`,
          metadata: {
            orderId,
            userId: user.id,
            totalShippingFee,
            adminShippingFees: JSON.stringify(shippingFees), // Pass admin shipping fees as metadata
            mobileNumber: paymentMethod === 'mobile_money' ? mobileNumber : '',
            mobileNetwork: paymentMethod === 'mobile_money' ? mobileNetwork : '',
            // Enhanced shipping details for order confirmation
            shippingDetails: JSON.stringify({
              address: `${shippingAddress.city}, ${shippingAddress.region}`,
              totalFee: totalShippingFee,
              vendorShipping: Object.entries(shippingFees).reduce((acc, [adminId, fee]) => {
                // Get vendor name from items if available
                const adminItems = items.filter(item => item.adminId === adminId);
                const vendorName = adminItems.length > 0 && adminItems[0].adminName 
                  ? adminItems[0].adminName : 'Vendor';
                
                // Add vendor shipping details
                acc[adminId] = {
                  fee: typeof fee === 'object' ? fee.fee || 0 : fee || 0,
                  vendorName
                };
                
                // Add additional shipping details if available
                if (typeof fee === 'object' && fee.details) {
                  acc[adminId].baseRegion = fee.details.baseRegion;
                  acc[adminId].customerRegion = fee.details.customerRegion;
                  acc[adminId].isSameRegion = fee.details.isSameRegion;
                }
                
                return acc;
              }, {})
            })
          }
        };
        
        console.log('Sending payment data to server:', paymentData);
        
        try {
          const paymentResponse = await initializePayment(paymentData);
          console.log('Payment initialization response:', paymentResponse);
          
          if (paymentResponse.success) {
            // Redirect to Paystack payment page
            window.location.href = paymentResponse.data.authorization_url;
          } else {
            throw new Error(paymentResponse.message || 'Payment initialization failed');
          }
        } catch (error) {
          console.error('Payment initialization error details:', error);
          throw error;
        }
      } else {
        throw new Error(orderAction.payload?.message || 'Order creation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      onError(error.message || 'Payment processing failed');
      toast.error(error.message || 'Payment processing failed');
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'GHS 0.00';
    
    // Handle case where price might be an object with a fee property
    if (typeof price === 'object' && price !== null) {
      if (price.fee !== undefined && typeof price.fee === 'number') {
        return `GHS ${price.fee.toFixed(2)}`;
      }
      return 'GHS 0.00';
    }
    
    // Handle string values that can be converted to numbers
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      if (!isNaN(numPrice)) {
        return `GHS ${numPrice.toFixed(2)}`;
      }
      return 'GHS 0.00';
    }
    
    // Handle regular number values
    if (typeof price === 'number') {
      return `GHS ${price.toFixed(2)}`;
    }
    
    return 'GHS 0.00';
  };
  
  // Get admin shipping details for display
  const adminGroups = groupItemsByAdmin();

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-center">Pay with Paystack</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Payment Method</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="mobile_money"
              checked={paymentMethod === 'mobile_money'}
              onChange={() => setPaymentMethod('mobile_money')}
              className="mr-2"
            />
            <span>Mobile Money</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              className="mr-2"
            />
            <span>Card</span>
          </label>
        </div>
      </div>
      
      {paymentMethod === 'mobile_money' && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Network</label>
            <div className="grid grid-cols-3 gap-3">
              {networks.map(network => (
                <button
                  key={network.id}
                  type="button"
                  onClick={() => setMobileNetwork(network.id)}
                  className={`p-3 rounded-lg border text-center ${
                    mobileNetwork === network.id 
                      ? `border-2 border-blue-500 ring-2 ring-blue-200 scale-105 ${network.color} text-white` 
                      : 'border-gray-200'
                  } transition-all`}
                >
                  {network.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="mobileNumber" className="block text-sm font-medium mb-2">
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobileNumber"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="e.g., 0241234567"
              className="w-full p-3 border border-gray-300 rounded-md"
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the mobile number registered with your mobile money account
            </p>
          </div>
        </>
      )}
      
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          
          {/* Shipping Fee Section - With Admin Breakdown */}
          <div className="border-t border-gray-100 pt-2 mb-2">
            <div className="flex justify-between mb-1 items-center">
              <span className="text-gray-600 flex items-center">
                <TruckIcon className="h-4 w-4 mr-2 text-gray-400" /> Shipping Fees:
              </span>
              <span className="font-semibold">{formatPrice(totalShippingFee)}</span>
            </div>
            
            {/* Show per-admin shipping fees */}
            {Object.keys(adminGroups).length > 1 && (
              <div className="ml-6 text-xs text-gray-500 space-y-1 mt-1">
                {Object.keys(adminGroups).map(adminId => (
                  <div key={adminId} className="flex justify-between">
                    <span className="flex items-center">
                      <Store className="h-3 w-3 mr-1" /> Seller {adminId.substring(0, 4)}...
                    </span>
                    <span>{formatPrice(adminGroups[adminId].shippingFee)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
            <span className="text-gray-800 font-medium">Total Amount:</span>
            <span className="font-bold">{formatPrice(amount)}</span>
          </div>
          {paymentMethod === 'mobile_money' && (
            <p className="text-xs text-gray-500 mt-3">
              You will receive a prompt on your phone to complete the payment
            </p>
          )}
        </div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full py-3 px-4 rounded-md font-medium text-white 
          ${isProcessing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} 
          transition-colors`}
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </motion.button>
    </div>
  );
};

export default PaystackPayment;
