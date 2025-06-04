import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/config/api';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Get all orders
export const fetchAllOrders = createAsyncThunk(
  'superAdminOrders/fetchAllOrders',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState().superAdminOrders;
      const now = Date.now();
      
      // Check if we have cached data that's still valid
      if (state.orders.length > 0 && state.lastFetchTime && (now - state.lastFetchTime) < CACHE_DURATION) {
        return { orders: state.orders };
      }

      const response = await apiClient.get('/api/superAdmin/orders/all');
      return { ...response.data, timestamp: now };
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

// Get orders by admin
export const fetchOrdersByAdmin = createAsyncThunk(
  'superAdminOrders/fetchOrdersByAdmin',
  async (adminId, { rejectWithValue, dispatch, getState }) => {
    try {
      if (adminId === null || adminId === undefined) {
        return dispatch(fetchAllOrders()).unwrap();
      }
      
      const state = getState().superAdminOrders;
      const now = Date.now();
      const cacheKey = `admin_${adminId}`;
      
      // Check if we have cached data that's still valid
      if (state.adminOrdersCache[cacheKey] && 
          state.adminOrdersCache[cacheKey].timestamp && 
          (now - state.adminOrdersCache[cacheKey].timestamp) < CACHE_DURATION) {
        return { orders: state.adminOrdersCache[cacheKey].orders };
      }

      const response = await apiClient.get(`/api/superAdmin/orders/admin/${adminId}`);
      return { ...response.data, adminId, timestamp: now };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders by admin');
    }
  }
);

// Get order statistics
export const fetchOrderStats = createAsyncThunk(
  'superAdminOrders/fetchOrderStats',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState().superAdminOrders;
      const now = Date.now();
      
      // Check if we have cached stats that's still valid
      if (state.orderStats && state.statsLastFetchTime && 
          (now - state.statsLastFetchTime) < CACHE_DURATION) {
        return { stats: state.orderStats };
      }

      const response = await apiClient.get('/api/superAdmin/orders/stats');
      return { ...response.data, timestamp: now };
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
  error: null,
  lastFetchTime: null,
  statsLastFetchTime: null,
  adminOrdersCache: {},
  isFetching: {
    orders: false,
    stats: false,
    adminOrders: false
  }
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
    },
    clearCache: (state) => {
      state.lastFetchTime = null;
      state.statsLastFetchTime = null;
      state.adminOrdersCache = {};
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.isFetching.orders = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.isFetching.orders = false;
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.lastFetchTime = action.payload.timestamp;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.isFetching.orders = false;
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch orders by admin
      .addCase(fetchOrdersByAdmin.pending, (state) => {
        state.isFetching.adminOrders = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrdersByAdmin.fulfilled, (state, action) => {
        state.isFetching.adminOrders = false;
        state.isLoading = false;
        state.filteredOrders = action.payload.orders;
        if (action.payload.adminId) {
          state.adminOrdersCache[`admin_${action.payload.adminId}`] = {
            orders: action.payload.orders,
            timestamp: action.payload.timestamp
          };
        }
      })
      .addCase(fetchOrdersByAdmin.rejected, (state, action) => {
        state.isFetching.adminOrders = false;
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch order statistics
      .addCase(fetchOrderStats.pending, (state) => {
        state.isFetching.stats = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.isFetching.stats = false;
        state.isLoading = false;
        if (action.payload && action.payload.stats) {
          state.orderStats = action.payload.stats;
          state.statsLastFetchTime = action.payload.timestamp;
        } else if (action.payload) {
          state.orderStats = action.payload;
          state.statsLastFetchTime = Date.now();
        }
      })
      .addCase(fetchOrderStats.rejected, (state, action) => {
        state.isFetching.stats = false;
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setSelectedAdmin, clearSelectedAdmin, clearCache } = superAdminOrdersSlice.actions;
export default superAdminOrdersSlice.reducer;
