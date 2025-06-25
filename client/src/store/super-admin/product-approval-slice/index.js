import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Async thunks for API calls
export const fetchPendingProducts = createAsyncThunk(
  'productApproval/fetchPending',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/superAdmin/product-approval/pending?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch pending products' });
    }
  }
);

export const fetchAllProducts = createAsyncThunk(
  'productApproval/fetchAll',
  async ({ page = 1, limit = 20, status = '' }, { rejectWithValue }) => {
    try {
      const statusParam = status ? `&status=${status}` : '';
      const response = await axios.get(
        `${API_URL}/api/superAdmin/product-approval/all?page=${page}&limit=${limit}${statusParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch products' });
    }
  }
);

export const fetchApprovalStats = createAsyncThunk(
  'productApproval/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/superAdmin/product-approval/stats`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch stats' });
    }
  }
);

export const approveProduct = createAsyncThunk(
  'productApproval/approve',
  async ({ productId, comments = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/superAdmin/product-approval/${productId}/approve`,
        { comments },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return { productId, ...response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to approve product' });
    }
  }
);

export const rejectProduct = createAsyncThunk(
  'productApproval/reject',
  async ({ productId, comments }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/superAdmin/product-approval/${productId}/reject`,
        { comments },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return { productId, ...response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to reject product' });
    }
  }
);

export const checkFeatureFlags = createAsyncThunk(
  'productApproval/checkFeatureFlags',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/feature-flags/status`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to check feature flags' });
    }
  }
);

// Initial state
const initialState = {
  // Products data
  pendingProducts: [],
  allProducts: [],
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  totalProducts: 0,
  
  // Statistics
  stats: {
    total: 0,
    byStatus: [],
    approvalTimes: null
  },
  
  // UI state
  loading: false,
  actionLoading: null,
  error: null,
  
  // Feature flags
  featureFlags: {
    productApproval: {
      enabled: false,
      superAdminInterface: false,
      newProductsOnly: false
    }
  },
  
  // Filters and search
  activeTab: 'pending',
  searchTerm: '',
  
  // Selected product for modal
  selectedProduct: null,
  modalOpen: false
};

// Product approval slice
const productApprovalSlice = createSlice({
  name: 'productApproval',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      state.currentPage = 1;
    },
    
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    openModal: (state, action) => {
      state.selectedProduct = action.payload;
      state.modalOpen = true;
    },
    
    closeModal: (state) => {
      state.selectedProduct = null;
      state.modalOpen = false;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetState: (state) => {
      return { ...initialState, featureFlags: state.featureFlags };
    }
  },
  
  extraReducers: (builder) => {
    // Fetch pending products
    builder
      .addCase(fetchPendingProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingProducts = action.payload.products;
        state.currentPage = action.payload.pagination.currentPage;
        state.totalPages = action.payload.pagination.totalPages;
        state.totalProducts = action.payload.pagination.totalProducts;
      })
      .addCase(fetchPendingProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      });
    
    // Fetch all products
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.allProducts = action.payload.products;
        state.currentPage = action.payload.pagination.currentPage;
        state.totalPages = action.payload.pagination.totalPages;
        state.totalProducts = action.payload.pagination.totalProducts;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      });
    
    // Fetch stats
    builder
      .addCase(fetchApprovalStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats;
      });
    
    // Approve product
    builder
      .addCase(approveProduct.pending, (state, action) => {
        state.actionLoading = action.meta.arg.productId;
        state.error = null;
      })
      .addCase(approveProduct.fulfilled, (state, action) => {
        state.actionLoading = null;
        
        // Remove from pending products
        state.pendingProducts = state.pendingProducts.filter(
          product => product._id !== action.payload.productId
        );
        
        // Update in all products if present
        const productIndex = state.allProducts.findIndex(
          product => product._id === action.payload.productId
        );
        if (productIndex !== -1) {
          state.allProducts[productIndex].approvalStatus = 'approved';
          state.allProducts[productIndex].approvedAt = new Date().toISOString();
        }
        
        // Close modal
        state.modalOpen = false;
        state.selectedProduct = null;
      })
      .addCase(approveProduct.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload.message;
      });
    
    // Reject product
    builder
      .addCase(rejectProduct.pending, (state, action) => {
        state.actionLoading = action.meta.arg.productId;
        state.error = null;
      })
      .addCase(rejectProduct.fulfilled, (state, action) => {
        state.actionLoading = null;
        
        // Remove from pending products
        state.pendingProducts = state.pendingProducts.filter(
          product => product._id !== action.payload.productId
        );
        
        // Update in all products if present
        const productIndex = state.allProducts.findIndex(
          product => product._id !== action.payload.productId
        );
        if (productIndex !== -1) {
          state.allProducts[productIndex].approvalStatus = 'rejected';
          state.allProducts[productIndex].rejectedAt = new Date().toISOString();
        }
        
        // Close modal
        state.modalOpen = false;
        state.selectedProduct = null;
      })
      .addCase(rejectProduct.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload.message;
      });
    
    // Check feature flags
    builder
      .addCase(checkFeatureFlags.fulfilled, (state, action) => {
        // Map API response to expected Redux state structure
        state.featureFlags = {
          productApproval: {
            enabled: action.payload.productApproval?.enabled || false,
            superAdminInterface: action.payload.productApproval?.enabled || false,
            newProductsOnly: false
          },
          messaging: {
            enabled: action.payload.messaging?.enabled || false
          }
        };
      });
  }
});

// Export actions
export const {
  setActiveTab,
  setSearchTerm,
  setCurrentPage,
  openModal,
  closeModal,
  clearError,
  resetState
} = productApprovalSlice.actions;

// Selectors
export const selectPendingProducts = (state) => state.productApproval.pendingProducts;
export const selectAllProducts = (state) => state.productApproval.allProducts;
export const selectApprovalStats = (state) => state.productApproval.stats;
export const selectLoading = (state) => state.productApproval.loading;
export const selectActionLoading = (state) => state.productApproval.actionLoading;
export const selectError = (state) => state.productApproval.error;
export const selectCurrentPage = (state) => state.productApproval.currentPage;
export const selectTotalPages = (state) => state.productApproval.totalPages;
export const selectActiveTab = (state) => state.productApproval.activeTab;
export const selectSearchTerm = (state) => state.productApproval.searchTerm;
export const selectSelectedProduct = (state) => state.productApproval.selectedProduct;
export const selectModalOpen = (state) => state.productApproval.modalOpen;
export const selectFeatureFlags = (state) => state.productApproval.featureFlags;

// Filtered products selector
export const selectFilteredProducts = (state) => {
  const { activeTab, searchTerm, pendingProducts, allProducts } = state.productApproval;
  const products = activeTab === 'pending' ? pendingProducts : allProducts;
  
  if (!searchTerm) return products;
  
  return products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.createdBy?.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export default productApprovalSlice.reducer; 