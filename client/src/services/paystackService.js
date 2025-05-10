import axios from 'axios';

const API_URL = 'http://localhost:5000/api/payment';

// Initialize transaction and get authorization URL
export const initializePayment = async (data) => {
  try {
    console.log('Initializing payment with data:', data);
    
    // Make sure amount is a number
    const payloadToSend = {
      ...data,
      amount: parseFloat(data.amount)
    };
    
    const response = await axios.post(`${API_URL}/paystack/initialize`, payloadToSend, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Payment initialization successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error initializing payment:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};

// Verify payment after successful transaction
export const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(`${API_URL}/paystack/verify/${reference}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Get list of payment channels (for mobile money options)
export const getPaymentChannels = async () => {
  try {
    const response = await axios.get(`${API_URL}/paystack/channels`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching payment channels:', error);
    throw error;
  }
};
