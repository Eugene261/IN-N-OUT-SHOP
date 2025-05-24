import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  testimonials: [],
  testimonialStats: null,
  isLoading: false,
  error: null
};

// Fetch customer testimonials
export const fetchTestimonials = createAsyncThunk(
  'testimonials/fetchTestimonials',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shop/testimonials/get`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch testimonials');
    }
  }
);

// Fetch testimonial statistics
export const fetchTestimonialStats = createAsyncThunk(
  'testimonials/fetchTestimonialStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shop/testimonials/stats`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch testimonial statistics');
    }
  }
);

const testimonialsSlice = createSlice({
  name: 'testimonials',
  initialState,
  reducers: {
    clearTestimonialsData: (state) => {
      state.testimonials = [];
      state.testimonialStats = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTestimonials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTestimonials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.testimonials = action.payload.data;
        state.error = null;
      })
      .addCase(fetchTestimonials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTestimonialStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTestimonialStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.testimonialStats = action.payload.data;
        state.error = null;
      })
      .addCase(fetchTestimonialStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearTestimonialsData } = testimonialsSlice.actions;
export default testimonialsSlice.reducer; 