import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  statsData: null,
  isLoading: false,
  error: null
};

// Fetch platform statistics
export const fetchStats = createAsyncThunk(
  'stats/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shop/stats/get`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    clearStatsData: (state) => {
      state.statsData = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statsData = action.payload.data;
        state.error = null;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.statsData = null;
      });
  }
});

export const { clearStatsData } = statsSlice.actions;
export default statsSlice.reducer; 