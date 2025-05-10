import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configure axios with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
});

// Get all orders
export const fetchAllOrders = createAsyncThunk(
  'superAdminOrders/fetchAllOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/superAdmin/orders/all', {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

// Get orders by admin
export const fetchOrdersByAdmin = createAsyncThunk(
  'superAdminOrders/fetchOrdersByAdmin',
  async (adminId, { rejectWithValue, dispatch }) => {
    try {
      // If adminId is null or undefined, fetch all orders instead
      if (adminId === null || adminId === undefined) {
        return dispatch(fetchAllOrders()).unwrap();
      }
      
      const response = await api.get(`/api/superAdmin/orders/admin/${adminId}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders by admin');
    }
  }
);

// Get order statistics
export const fetchOrderStats = createAsyncThunk(
  'superAdminOrders/fetchOrderStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/superAdmin/orders/stats', {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order statistics');
    }
  }
);

const initialState = {
  orders: [],
  filteredOrders: [],
  orderStats: null,
  selectedAdmin: null,
  isLoading: false,
  error: null
};

const superAdminOrdersSlice = createSlice({
  name: 'superAdminOrders',
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
      state.filteredOrders = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch orders by admin
      .addCase(fetchOrdersByAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrdersByAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.filteredOrders = action.payload.orders;
      })
      .addCase(fetchOrdersByAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch order statistics
      .addCase(fetchOrderStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both possible data structures
        if (action.payload && action.payload.stats) {
          state.orderStats = action.payload.stats;
          console.log('Setting order stats from payload.stats:', action.payload.stats);
        } else if (action.payload) {
          state.orderStats = action.payload;
          console.log('Setting order stats directly from payload:', action.payload);
        }
      })
      .addCase(fetchOrderStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setSelectedAdmin, clearSelectedAdmin } = superAdminOrdersSlice.actions;
export default superAdminOrdersSlice.reducer;
