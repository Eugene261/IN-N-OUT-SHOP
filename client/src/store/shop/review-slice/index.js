import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Define the API base URL using environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const initialState = {
  isLoading: false,
  isSubmitting: false,
  reviews: [],
  error: null
};

// Add a new review
export const addReview = createAsyncThunk(
  'reviews/addReview',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/shop/review/add`, data);
      // After successfully adding a review, fetch updated reviews
      dispatch(getReviews(data.productId));
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit review'
      );
    }
  }
);

// Get all reviews for a product
export const getReviews = createAsyncThunk(
  'reviews/getReviews',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/shop/review/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reviews'
      );
    }
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Add review cases
      .addCase(addReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(addReview.fulfilled, (state) => {
        state.isSubmitting = false;
        // We now refresh reviews through the dispatch in the thunk
      })
      .addCase(addReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || 'An error occurred';
      })
      
      // Get reviews cases
      .addCase(getReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload.data;
      })
      .addCase(getReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'An error occurred';
        state.reviews = [];
      })
  }
});

export const { clearReviewErrors } = reviewSlice.actions;
export default reviewSlice.reducer;