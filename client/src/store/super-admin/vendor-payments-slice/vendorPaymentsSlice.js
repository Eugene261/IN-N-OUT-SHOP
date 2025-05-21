import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/superAdmin/vendor-payments';

// Get all vendor payments
export const fetchVendorPayments = createAsyncThunk(
  'superAdminVendorPayments/fetchVendorPayments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, vendorId, status, startDate, endDate } = params;
      
      let url = `${BASE_URL}?page=${page}&limit=${limit}`;
      
      if (vendorId) url += `&vendorId=${vendorId}`;
      if (status) url += `&status=${status}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const { data } = await axios.get(url, {
        withCredentials: true
      });
      
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get vendor payment summary
export const fetchVendorPaymentSummary = createAsyncThunk(
  'superAdminVendorPayments/fetchVendorPaymentSummary',
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

// Get single vendor payment details
export const fetchVendorPaymentDetails = createAsyncThunk(
  'superAdminVendorPayments/fetchVendorPaymentDetails',
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

// Create a new vendor payment
export const createVendorPayment = createAsyncThunk(
  'superAdminVendorPayments/createVendorPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(BASE_URL, paymentData, {
        withCredentials: true
      });
      
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Update payment status
export const updatePaymentStatus = createAsyncThunk(
  'superAdminVendorPayments/updatePaymentStatus',
  async ({ paymentId, status }, { rejectWithValue }) => {
    try {
      const { data } = await axios.patch(`${BASE_URL}/${paymentId}/status`, { status }, {
        withCredentials: true
      });
      
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  vendorPayments: [],
  pagination: {
    totalPages: 0,
    currentPage: 1,
    totalItems: 0
  },
  paymentDetails: null,
  summary: {
    totalPaid: 0,
    totalPending: 0,
    totalPlatformFee: 0,
    paymentsByVendor: [],
    recentPayments: []
  },
  isLoading: false,
  error: null,
  success: false,
  message: ''
};

const vendorPaymentsSlice = createSlice({
  name: 'superAdminVendorPayments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.message = '';
    },
    clearPaymentDetails: (state) => {
      state.paymentDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch vendor payments
      .addCase(fetchVendorPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vendorPayments = action.payload.payments;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchVendorPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch vendor payments';
      })
      
      // Fetch payment summary
      .addCase(fetchVendorPaymentSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorPaymentSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchVendorPaymentSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch payment summary';
      })
      
      // Fetch payment details
      .addCase(fetchVendorPaymentDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorPaymentDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentDetails = action.payload;
      })
      .addCase(fetchVendorPaymentDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch payment details';
      })
      
      // Create payment
      .addCase(createVendorPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createVendorPayment.fulfilled, (state) => {
        state.isLoading = false;
        state.success = true;
        state.message = 'Payment created successfully';
      })
      .addCase(createVendorPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to create payment';
      })
      
      // Update payment status
      .addCase(updatePaymentStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updatePaymentStatus.fulfilled, (state) => {
        state.isLoading = false;
        state.success = true;
        state.message = 'Payment status updated successfully';
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to update payment status';
      });
  }
});

export const { clearError, clearSuccess, clearPaymentDetails } = vendorPaymentsSlice.actions;
export default vendorPaymentsSlice.reducer;
