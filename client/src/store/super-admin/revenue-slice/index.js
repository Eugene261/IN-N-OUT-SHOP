import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configure axios with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
});

// Get admin revenue by time period
export const fetchAdminRevenueByTime = createAsyncThunk(
  'superAdminRevenue/fetchAdminRevenueByTime',
  async (period = 'daily', { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/superAdmin/revenue/by-time?period=${period}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin revenue data');
    }
  }
);

const initialState = {
  dailyRevenue: [],
  weeklyRevenue: [],
  monthlyRevenue: [],
  yearlyRevenue: [],
  isLoading: false,
  error: null
};

const superAdminRevenueSlice = createSlice({
  name: 'superAdminRevenue',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch admin revenue by time
      .addCase(fetchAdminRevenueByTime.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminRevenueByTime.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload && action.payload.success) {
          const { timePeriod, revenueData } = action.payload;
          console.log(`Received ${timePeriod} revenue data:`, revenueData);
          
          // Update the appropriate revenue data based on time period
          switch (timePeriod) {
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
        }
      })
      .addCase(fetchAdminRevenueByTime.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = superAdminRevenueSlice.actions;
export default superAdminRevenueSlice.reducer;
