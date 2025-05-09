import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { initializePayment, verifyPayment } from '../../services/paystackService';
import { createNewOrder } from '../../store/shop/order-slice';
import { PAYSTACK_PUBLIC_KEY, MOBILE_MONEY_NETWORKS } from '../../config/paystack';

const PaystackPayment = ({ amount, items, shippingAddress, onSuccess, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [mobileNetwork, setMobileNetwork] = useState('mtn');
  const [mobileNumber, setMobileNumber] = useState('');
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  // Using networks from config file
  const networks = MOBILE_MONEY_NETWORKS;

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
      
      // Create an order first
      const orderAction = await dispatch(createNewOrder({
        userId: user.id,
        cartItems: items,
        addressInfo: shippingAddress,
        totalAmount: amount,
        paymentMethod: 'paystack',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        orderDate: new Date(),
        orderUpdateDate: new Date()
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
            mobileNumber: paymentMethod === 'mobile_money' ? mobileNumber : '',
            mobileNetwork: paymentMethod === 'mobile_money' ? mobileNetwork : ''
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
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">GHS {amount.toFixed(2)}</span>
          </div>
          {paymentMethod === 'mobile_money' && (
            <p className="text-xs text-gray-500">
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
