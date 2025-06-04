import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

// Configure axios with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Fetch admin profile
export const fetchAdminProfile = createAsyncThunk(
  'superAdminProfile/fetchAdminProfile',
  async (adminId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/superAdmin/users/profile/${adminId}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin profile');
    }
  }
);

const initialState = {
  currentProfile: null,
  isLoading: false,
  error: null,
  success: null
};

const superAdminProfileSlice = createSlice({
  name: 'superAdminProfile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearProfile: (state) => {
      state.currentProfile = null;
      state.error = null;
      state.success = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch admin profile
      .addCase(fetchAdminProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProfile = action.payload.profile;
        state.success = 'Profile loaded successfully';
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.currentProfile = null;
      });
  }
});

export const { clearError, clearSuccess, clearProfile } = superAdminProfileSlice.actions;
export default superAdminProfileSlice.reducer; 