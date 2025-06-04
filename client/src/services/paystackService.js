import axios from 'axios';
import { handleApiError } from '../utils/apiErrorHandler';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/api/payment`;

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
    // Use the standardized error handler
    const errorDetails = handleApiError(error, {
      context: 'payment initialization',
      showToast: true
    });
    
    // Rethrow with standardized error information
    throw errorDetails;
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
    // Use the standardized error handler
    const errorDetails = handleApiError(error, {
      context: 'payment verification',
      showToast: true
    });
    
    // Rethrow with standardized error information
    throw errorDetails;
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
    // Use the standardized error handler
    const errorDetails = handleApiError(error, {
      context: 'fetching payment channels',
      showToast: false // Less critical, may not need a toast
    });
    
    // Rethrow with standardized error information
    throw errorDetails;
  }
};
