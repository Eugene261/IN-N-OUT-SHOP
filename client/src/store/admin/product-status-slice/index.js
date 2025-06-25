import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Async thunks for API calls
export const fetchMyProductStatus = createAsyncThunk(
  'productStatus/fetchMyProducts',
  async ({ approvalStatus = 'all' }, { rejectWithValue }) => {
    try {
      const statusParam = approvalStatus !== 'all' ? `&approvalStatus=${approvalStatus}` : '';
      const response = await axios.get(
        `${API_URL}/api/admin/products/my-products?includeApprovalStatus=true${statusParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch product status' });
    }
  }
);

export const checkProductApprovalFeature = createAsyncThunk(
  'productStatus/checkFeature',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/feature-flags/status`);
      return response.data.data.productApproval || { enabled: false };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to check feature status' });
    }
  }
);

// Initial state
const initialState = {
  // Products data
  products: [],
  
  // Statistics
  stats: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  },
  
  // UI state
  loading: false,
  error: null,
  
  // Feature status
  featureEnabled: false,
  
  // Filters
  activeFilter: 'all'
};

// Product status slice
const productStatusSlice = createSlice({
  name: 'productStatus',
  initialState,
  reducers: {
    setActiveFilter: (state, action) => {
      state.activeFilter = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateProductStatus: (state, action) => {
      const { productId, status, comments } = action.payload;
      const productIndex = state.products.findIndex(p => p._id === productId);
      
      if (productIndex !== -1) {
        state.products[productIndex].approvalStatus = status;
        if (comments) {
          state.products[productIndex].approvalComments = comments;
        }
        state.products[productIndex].approvedAt = status === 'approved' ? new Date().toISOString() : null;
        state.products[productIndex].rejectedAt = status === 'rejected' ? new Date().toISOString() : null;
      }
    },
    
    resetState: () => initialState
  },
  
  extraReducers: (builder) => {
    // Fetch my products status
    builder
      .addCase(fetchMyProductStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyProductStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        
        // Calculate stats
        const statusCounts = action.payload.reduce((acc, product) => {
          const status = product.approvalStatus || 'approved'; // Default for existing products
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        
        state.stats = {
          total: action.payload.length,
          pending: statusCounts.pending || 0,
          approved: statusCounts.approved || 0,
          rejected: statusCounts.rejected || 0
        };
      })
      .addCase(fetchMyProductStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      });
    
    // Check feature status
    builder
      .addCase(checkProductApprovalFeature.fulfilled, (state, action) => {
        state.featureEnabled = action.payload.enabled;
      })
      .addCase(checkProductApprovalFeature.rejected, (state) => {
        state.featureEnabled = false;
      });
  }
});

// Export actions
export const {
  setActiveFilter,
  clearError,
  updateProductStatus,
  resetState
} = productStatusSlice.actions;

// Selectors
export const selectProducts = (state) => state.productStatus.products;
export const selectStats = (state) => state.productStatus.stats;
export const selectLoading = (state) => state.productStatus.loading;
export const selectError = (state) => state.productStatus.error;
export const selectActiveFilter = (state) => state.productStatus.activeFilter;
export const selectFeatureEnabled = (state) => state.productStatus.featureEnabled;

// Filtered products selector
export const selectFilteredProducts = (state) => {
  const { products, activeFilter } = state.productStatus;
  
  if (activeFilter === 'all') return products;
  
  return products.filter(product => {
    const status = product.approvalStatus || 'approved';
    return status === activeFilter;
  });
};

export default productStatusSlice.reducer; 