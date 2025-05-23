import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchVendorPayments = createAsyncThunk(
  'superAdminVendorPayments/fetchVendorPayments',
  async ({ page = 1, status, vendorId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      
      if (status && status !== 'all') {
        params.append('status', status);
      }
      
      if (vendorId) {
        params.append('vendor', vendorId);
      }
      
      if (startDate) {
        params.append('startDate', startDate);
      }
      
      if (endDate) {
        params.append('endDate', endDate);
      }
      
      const response = await axios.get(`/api/superAdmin/vendor-payments?${params.toString()}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchPaymentSummary = createAsyncThunk(
  'superAdminVendorPayments/fetchPaymentSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/superAdmin/vendor-payments/summary', {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchPaymentDetails = createAsyncThunk(
  'superAdminVendorPayments/fetchPaymentDetails',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/superAdmin/vendor-payments/${paymentId}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const createPayment = createAsyncThunk(
  'superAdminVendorPayments/createPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      // Handle both FormData (with file) and regular object
      const isFormData = paymentData instanceof FormData;
      
      const response = await axios.post('/api/superAdmin/vendor-payments', paymentData, {
        withCredentials: true,
        headers: {
          'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const uploadReceipt = createAsyncThunk(
  'superAdminVendorPayments/uploadReceipt',
  async ({ paymentId, receiptFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      
      const response = await axios.post(`/api/superAdmin/vendor-payments/${paymentId}/receipt`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updatePaymentStatus = createAsyncThunk(
  'superAdminVendorPayments/updatePaymentStatus',
  async ({ paymentId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/superAdmin/vendor-payments/${paymentId}/status`, {
        status,
        notes
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
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
    completedCount: 0,
    pendingCount: 0,
    lastPaymentDate: null,
    lastPaymentAmount: 0,
    totalWithReceipts: 0,
    totalWithoutReceipts: 0
  },
  isLoading: false,
  error: null,
  success: false,
  message: '',
  uploadProgress: 0,
  isUploading: false
};

// Slice
const superAdminVendorPaymentsSlice = createSlice({
  name: 'superAdminVendorPayments',
  initialState,
  reducers: {
    clearPaymentDetails: (state) => {
      state.paymentDetails = null;
    },
    resetMessages: (state) => {
      state.error = null;
      state.success = false;
      state.message = '';
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    setIsUploading: (state, action) => {
      state.isUploading = action.payload;
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
        state.vendorPayments = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0
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
        state.summary = {
          ...state.summary,
          ...action.payload.data
        };
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
        state.paymentDetails = action.payload.data || null;
      })
      .addCase(fetchPaymentDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch payment details';
      })
      
      // Create Payment
      .addCase(createPayment.pending, (state) => {
        state.isLoading = true;
        state.isUploading = true;
        state.error = null;
        state.success = false;
        state.uploadProgress = 0;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isUploading = false;
        state.success = true;
        state.uploadProgress = 100;
        state.message = action.payload.message || 'Payment created successfully';
        
        // Add the new payment to the beginning of the list
        if (action.payload.data) {
          state.vendorPayments.unshift(action.payload.data);
        }
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isUploading = false;
        state.uploadProgress = 0;
        state.error = action.payload?.message || 'Failed to create payment';
      })
      
      // Upload Receipt
      .addCase(uploadReceipt.pending, (state) => {
        state.isUploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadReceipt.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 100;
        state.success = true;
        state.message = action.payload.message || 'Receipt uploaded successfully';
        
        // Update payment details if it's the current one being viewed
        if (state.paymentDetails && state.paymentDetails._id === action.payload.paymentId) {
          state.paymentDetails.receiptUrl = action.payload.data.receiptUrl;
          state.paymentDetails.receiptName = action.payload.data.receiptName;
        }
        
        // Update payment in the list
        state.vendorPayments = state.vendorPayments.map(payment =>
          payment._id === action.payload.paymentId
            ? { ...payment, receiptUrl: action.payload.data.receiptUrl, receiptName: action.payload.data.receiptName }
            : payment
        );
      })
      .addCase(uploadReceipt.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.error = action.payload?.message || 'Failed to upload receipt';
      })
      
      // Update Payment Status
      .addCase(updatePaymentStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = 'Payment status updated successfully';
        
        // Update payment details if it's the current one being viewed
        if (state.paymentDetails && state.paymentDetails._id === action.payload._id) {
          state.paymentDetails.status = action.payload.status;
        }
        
        // Update the status in the list
        state.vendorPayments = state.vendorPayments.map(payment => 
          payment._id === action.payload._id 
            ? { ...payment, status: action.payload.status }
            : payment
        );
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to update payment status';
      });
  }
});

export const { 
  clearPaymentDetails, 
  resetMessages, 
  setUploadProgress, 
  setIsUploading 
} = superAdminVendorPaymentsSlice.actions;

export default superAdminVendorPaymentsSlice.reducer;
