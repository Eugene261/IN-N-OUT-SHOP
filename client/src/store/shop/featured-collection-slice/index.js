import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Initial state
const initialState = {
  collections: [],
  isLoading: false,
  error: null
};

// Fetch all public featured collections
export const fetchPublicFeaturedCollections = createAsyncThunk(
  'shopFeaturedCollections/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/shop/featured-collections'
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured collections');
    }
  }
);

// Create the slice
const shopFeaturedCollectionSlice = createSlice({
  name: 'shopFeaturedCollections',
  initialState,
  reducers: {
    resetShopFeaturedCollections(state) {
      state.collections = [];
      state.isLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all featured collections
      .addCase(fetchPublicFeaturedCollections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicFeaturedCollections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collections = action.payload.data;
      })
      .addCase(fetchPublicFeaturedCollections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch featured collections';
      });
  }
});

export const { resetShopFeaturedCollections } = shopFeaturedCollectionSlice.actions;
export default shopFeaturedCollectionSlice.reducer;
