const axios = require('axios');
const Order = require('../../models/Order');
require('dotenv').config();


// Get Paystack secret key from environment variables or use fallback for development
// In production, this should ONLY come from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Log confirmation of environment setup
if (PAYSTACK_SECRET_KEY) {
  console.log('Paystack API key loaded successfully');
} else {
  console.error('WARNING: PAYSTACK_SECRET_KEY is not set in environment variables');
}

// Initialize payment
const initializePayment = async (req, res) => {
  try {
    // Log the request body for debugging
    console.log('Payment initialization request:', JSON.stringify(req.body, null, 2));
    
    const { amount, email, callbackUrl, metadata } = req.body;
    
    if (!amount || !email) {
      console.log('Missing required fields:', { amount, email });
      return res.status(400).json({
        success: false,
        message: 'Amount and email are required'
      });
    }

    // Ensure amount is a number and convert to integer pesewas
    // Paystack requires integer amounts with no decimal places
    const amountInPesewas = Math.round(Number(amount) * 100);
    
    if (isNaN(amountInPesewas) || amountInPesewas <= 0) {
      console.log('Invalid amount format:', amount);
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid positive number'
      });
    }
    
    console.log('Preparing Paystack API request with:', {
      amount: amountInPesewas,
      email,
      callback_url: callbackUrl,
      hasMetadata: !!metadata
    });
    
    // Check if secret key is available
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not set');
      return res.status(500).json({
        success: false,
        message: 'Payment service configuration error'
      });
    }

    // Make request to Paystack API
    const payloadToSend = {
      amount: amountInPesewas,
      email,
      callback_url: callbackUrl || `${req.protocol}://${req.get('host')}/shop/order-confirmation`,
      metadata,
      channels: ['card', 'bank', 'mobile_money'], // Include mobile money as a payment channel
    };
    
    console.log('Sending to Paystack:', JSON.stringify(payloadToSend, null, 2));
    
    const response = await axios.post('https://api.paystack.co/transaction/initialize', payloadToSend, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Paystack response:', JSON.stringify(response.data, null, 2));
    
    return res.status(200).json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    console.error('Error initializing payment:');
    if (error.response) {
      console.error('Response error data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status);
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received:', JSON.stringify(error.request, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Error initializing payment',
      error: error.response?.data || error.message
    });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    
    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Reference is required'
      });
    }

    // Make request to Paystack API
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const { status, data } = response.data;

    if (status && data.status === 'success') {
      // Payment was successful, update order status
      if (data.metadata && data.metadata.orderId) {
        await Order.findByIdAndUpdate(data.metadata.orderId, {
          paymentStatus: 'paid',
          status: 'confirmed',
          paymentReference: reference,
          paymentMethod: 'paystack',
          paymentDetails: data
        });
      }

      return res.status(200).json({
        success: true,
        data: response.data.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: response.data
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.response?.data || error.message
    });
  }
};

// Get payment channels (for mobile money options)
const getPaymentChannels = async (req, res) => {
  try {
    // Make request to Paystack API
    const response = await axios.get('https://api.paystack.co/payment-channels', {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return res.status(200).json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    console.error('Error fetching payment channels:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payment channels',
      error: error.response?.data || error.message
    });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  getPaymentChannels
};
