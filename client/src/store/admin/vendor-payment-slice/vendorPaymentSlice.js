import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const BASE_URL = `${API_BASE_URL}/api/admin/vendor-payments`;

// Get payment history for the logged-in admin
export const fetchPaymentHistory = createAsyncThunk(
  'adminVendorPayment/fetchPaymentHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, startDate, endDate } = params;
      
      let url = `${BASE_URL}/history?page=${page}&limit=${limit}`;
      
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const { data } = await axios.get(url, {
        withCredentials: true
      });
      
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get payment summary stats
export const fetchPaymentSummary = createAsyncThunk(
  'adminVendorPayment/fetchPaymentSummary',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { startDate, endDate } = params;
      
      let url = `${BASE_URL}/summary`;
      
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      const { data } = await axios.get(url, {
        withCredentials: true
      });
      
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get details of a specific payment
export const fetchPaymentDetails = createAsyncThunk(
  'adminVendorPayment/fetchPaymentDetails',
  async (paymentId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/${paymentId}`, {
        withCredentials: true
      });
      
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  paymentHistory: [],
  pagination: {
    totalPages: 0,
    currentPage: 1,
    totalItems: 0
  },
  paymentDetails: null,
  summary: {
    totalEarnings: 0,
    platformFees: 0,
    totalWithdrawn: 0,
    currentBalance: 0,
    recentPayments: []
  },
  isLoading: false,
  error: null
};

const vendorPaymentSlice = createSlice({
  name: 'adminVendorPayment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPaymentDetails: (state) => {
      state.paymentDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch payment history
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentHistory = action.payload.data || [];
        state.pagination = {
          totalPages: action.payload.totalPages || 0,
          currentPage: action.payload.currentPage || 1,
          totalItems: action.payload.totalCount || 0
        };
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch payment history';
      })
      
      // Fetch payment summary
      .addCase(fetchPaymentSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        // Use the enhanced API response that includes user financial data
        const apiData = action.payload.data || {};
        state.summary = {
          totalEarnings: apiData.totalEarnings || 0,
          platformFees: apiData.platformFees || 0,
          totalWithdrawn: apiData.totalWithdrawn || 0,
          currentBalance: apiData.currentBalance || 0,
          recentPayments: apiData.recentPayments || []
        };
      })
      .addCase(fetchPaymentSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch payment summary';
      })
      
      // Fetch payment details
      .addCase(fetchPaymentDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentDetails = action.payload.data;
      })
      .addCase(fetchPaymentDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch payment details';
      });
  }
});

export const { clearError, clearPaymentDetails } = vendorPaymentSlice.actions;
export default vendorPaymentSlice.reducer;
