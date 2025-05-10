import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configure axios with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
});

// Get all products
export const fetchAllProducts = createAsyncThunk(
  'superAdminProducts/fetchAllProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/superAdmin/products/all', {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

// Get products by admin
export const fetchProductsByAdmin = createAsyncThunk(
  'superAdminProducts/fetchProductsByAdmin',
  async (adminId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/superAdmin/products/admin/${adminId}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products by admin');
    }
  }
);

// Get product statistics
export const fetchProductStats = createAsyncThunk(
  'superAdminProducts/fetchProductStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/superAdmin/products/stats', {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product statistics');
    }
  }
);

// Get featured products (bestsellers and new arrivals)
export const fetchFeaturedProducts = createAsyncThunk(
  'superAdminProducts/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/superAdmin/products/featured', {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured products');
    }
  }
);

const initialState = {
  products: [],
  filteredProducts: [],
  featuredProducts: [],
  productStats: null,
  selectedAdmin: null,
  isLoading: false,
  error: null
};

const superAdminProductsSlice = createSlice({
  name: 'superAdminProducts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedAdmin: (state, action) => {
      state.selectedAdmin = action.payload;
    },
    clearSelectedAdmin: (state) => {
      state.selectedAdmin = null;
      state.filteredProducts = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all products
      .addCase(fetchAllProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch products by admin
      .addCase(fetchProductsByAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductsByAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.filteredProducts = action.payload.products;
      })
      .addCase(fetchProductsByAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch product statistics
      .addCase(fetchProductStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productStats = action.payload.stats;
      })
      .addCase(fetchProductStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch featured products
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredProducts = action.payload.products;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setSelectedAdmin, clearSelectedAdmin } = superAdminProductsSlice.actions;
export default superAdminProductsSlice.reducer;
