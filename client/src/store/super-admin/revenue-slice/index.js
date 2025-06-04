import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

// Configure axios with base URL and timeout
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000 // 15 seconds timeout
});

// Get admin revenue by time period
export const fetchAdminRevenueByTime = createAsyncThunk(
  'superAdminRevenue/fetchAdminRevenueByTime',
  async (period = 'daily', { rejectWithValue }) => {
    try {
      console.log(`fetchAdminRevenueByTime: Starting request for period: ${period}`);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log(`fetchAdminRevenueByTime: Token exists: ${!!token}`);
      
      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      // Add authorization header if token exists
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log(`fetchAdminRevenueByTime: Added Authorization header for period: ${period}`);
      }
      
      const response = await api.get(`/api/superAdmin/revenue/by-time?period=${period}`, config);
      console.log(`fetchAdminRevenueByTime: Received response for period: ${period}`, response.data);
      return { ...response.data, requestedPeriod: period };
    } catch (error) {
      console.error(`fetchAdminRevenueByTime: Error for period: ${period}`, error);
      console.error(`fetchAdminRevenueByTime: Error response:`, error.response?.data);
      console.error(`fetchAdminRevenueByTime: Error status:`, error.response?.status);
      return rejectWithValue({ 
        message: error.response?.data?.message || 'Failed to fetch admin revenue data',
        period: period 
      });
    }
  }
);

const initialState = {
  dailyRevenue: [],
  weeklyRevenue: [],
  monthlyRevenue: [],
  yearlyRevenue: [],
  // Track loading state for each period separately
  loadingStates: {
    daily: false,
    weekly: false,
    monthly: false,
    yearly: false
  },
  // Track errors for each period separately
  errors: {
    daily: null,
    weekly: null,
    monthly: null,
    yearly: null
  },
  // Overall loading state (true if any period is loading)
  isLoading: false,
  error: null
};

const superAdminRevenueSlice = createSlice({
  name: 'superAdminRevenue',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.errors = {
        daily: null,
        weekly: null,
        monthly: null,
        yearly: null
      };
    },
    clearPeriodError: (state, action) => {
      const period = action.payload;
      if (state.errors[period]) {
        state.errors[period] = null;
      }
    },
    fetchTimeout: (state) => {
      // Handle timeout by setting all loading states to false and adding a warning
      state.loadingStates = {
        daily: false,
        weekly: false,
        monthly: false,
        yearly: false
      };
      state.isLoading = false;
      state.error = 'Some revenue data is taking too long to load. Displaying available data.';
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch admin revenue by time
      .addCase(fetchAdminRevenueByTime.pending, (state, action) => {
        const period = action.meta.arg; // Get the period from the action argument
        console.log(`Redux: fetchAdminRevenueByTime.pending for period: ${period}`);
        state.loadingStates[period] = true;
        state.isLoading = true; // Overall loading state
        state.errors[period] = null;
        state.error = null;
      })
      .addCase(fetchAdminRevenueByTime.fulfilled, (state, action) => {
        const { timePeriod, revenueData, requestedPeriod } = action.payload;
        const period = requestedPeriod || timePeriod;
        
        console.log(`Redux: fetchAdminRevenueByTime.fulfilled for period: ${period}`, action.payload);
        
        // Update loading state for this specific period
        state.loadingStates[period] = false;
        
        // Update overall loading state (false only if all periods are done)
        state.isLoading = Object.values(state.loadingStates).some(loading => loading);
        console.log(`Redux: Updated loading states after ${period} fulfilled:`, state.loadingStates, 'Overall loading:', state.isLoading);
        
        if (action.payload && action.payload.success) {
          console.log(`Received ${period} revenue data:`, revenueData);
          
          // Update the appropriate revenue data based on time period
          switch (period) {
            case 'daily':
              state.dailyRevenue = revenueData || [];
              break;
            case 'weekly':
              state.weeklyRevenue = revenueData || [];
              break;
            case 'monthly':
              state.monthlyRevenue = revenueData || [];
              break;
            case 'yearly':
              state.yearlyRevenue = revenueData || [];
              break;
            default:
              // Default to daily if period is not recognized
              state.dailyRevenue = revenueData || [];
          }
        } else {
          console.error('Invalid response format from revenue API:', action.payload);
          state.errors[period] = 'Invalid response format from server';
        }
      })
      .addCase(fetchAdminRevenueByTime.rejected, (state, action) => {
        const period = action.payload?.period || action.meta.arg;
        
        console.log(`Redux: fetchAdminRevenueByTime.rejected for period: ${period}`, action.payload);
        
        // Update loading state for this specific period
        state.loadingStates[period] = false;
        
        // Update overall loading state (false only if all periods are done)
        state.isLoading = Object.values(state.loadingStates).some(loading => loading);
        console.log(`Redux: Updated loading states after ${period} rejected:`, state.loadingStates, 'Overall loading:', state.isLoading);
        
        // Set error for this specific period
        state.errors[period] = action.payload?.message || 'Failed to fetch revenue data';
        
        // Set overall error if this was the only request or if no data is available
        if (!state.isLoading) {
          const hasAnyData = state.dailyRevenue.length > 0 || 
                            state.weeklyRevenue.length > 0 || 
                            state.monthlyRevenue.length > 0 || 
                            state.yearlyRevenue.length > 0;
          
          if (!hasAnyData) {
            state.error = action.payload?.message || 'Failed to fetch revenue data';
          }
        }
      });
  }
});

export const { clearError, clearPeriodError, fetchTimeout } = superAdminRevenueSlice.actions;
export default superAdminRevenueSlice.reducer;
