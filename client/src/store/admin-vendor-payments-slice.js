import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

// Fetch Vendor Payments
export const fetchVendorPayments = createAsyncThunk(
  'adminVendorPayments/fetchVendorPayments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, vendorId, status, startDate, endDate } = params;
      
      let url = `${API_BASE_URL}/api/admin/vendor-payments?page=${page}&limit=${limit}`;
      
      if (vendorId) url += `&vendorId=${vendorId}`;
      if (status) url += `&status=${status}`;
      if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;
      
      const response = await axios.get(url, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Fetch Payment Details
export const fetchPaymentDetails = createAsyncThunk(
  'adminVendorPayments/fetchPaymentDetails',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/vendor-payments/${paymentId}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchPaymentSummary = createAsyncThunk(
  'adminVendorPayments/fetchPaymentSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/vendor-payments/summary`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Initial state
const initialState = {
  vendorPayments: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  },
  paymentDetails: null,
  summary: {
    totalPaid: 0,
    pendingAmount: 0,
    paymentCount: 0,
    pendingCount: 0,
    lastPaymentDate: null,
    lastPaymentAmount: 0,
    unviewedCount: 0
  },
  isLoading: false,
  error: null,
  success: false,
  message: ''
};

// Slice
const adminVendorPaymentsSlice = createSlice({
  name: 'adminVendorPayments',
  initialState,
  reducers: {
    clearPaymentDetails: (state) => {
      state.paymentDetails = null;
    },
    resetMessages: (state) => {
      state.error = null;
      state.success = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Vendor Payments
      .addCase(fetchVendorPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vendorPayments = action.payload.data;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalCount: action.payload.totalCount
        };
      })
      .addCase(fetchVendorPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch vendor payments';
      })
      
      // Fetch Payment Summary
      .addCase(fetchPaymentSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload.data;
      })
      .addCase(fetchPaymentSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch payment summary';
      })
      
      // Fetch Payment Details
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

export const { clearPaymentDetails, resetMessages } = adminVendorPaymentsSlice.actions;
export default adminVendorPaymentsSlice.reducer;
