import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper function to get auth configuration
const getAuthConfig = (isFormData = false) => {
  return {
    withCredentials: true, // This is crucial for sending cookies with the request
    headers: {
      // Don't set Content-Type for FormData, browser will set it with boundary
      ...(!isFormData && { 'Content-Type': 'application/json' })
      // No Authorization header needed - the cookie will be sent automatically
    }
  };
};

// Initial state
const initialState = {
  collections: [],
  isLoading: false,
  error: null
};

// Fetch all featured collections
export const fetchFeaturedCollections = createAsyncThunk(
  'featuredCollections/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/superAdmin/featured-collections',
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch featured collections'
      );
    }
  }
);

// Create a new featured collection
export const createFeaturedCollection = createAsyncThunk(
  'featuredCollections/create',
  async (collectionData, { rejectWithValue }) => {
    try {
      // Check if collectionData is FormData
      const isFormData = collectionData instanceof FormData;
      
      const response = await axios.post(
        'http://localhost:5000/api/superAdmin/featured-collections',
        collectionData,
        getAuthConfig(isFormData)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create featured collection'
      );
    }
  }
);

// Update a featured collection
export const updateFeaturedCollection = createAsyncThunk(
  'featuredCollections/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // Check if data is FormData
      const isFormData = data instanceof FormData;
      
      const response = await axios.put(
        `http://localhost:5000/api/superAdmin/featured-collections/${id}`,
        data,
        getAuthConfig(isFormData)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update featured collection'
      );
    }
  }
);

// Delete a featured collection
export const deleteFeaturedCollection = createAsyncThunk(
  'featuredCollections/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/superAdmin/featured-collections/${id}`,
        getAuthConfig()
      );
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete featured collection'
      );
    }
  }
);

// Update positions of featured collections
export const updateCollectionPositions = createAsyncThunk(
  'featuredCollections/updatePositions',
  async (positions, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        'http://localhost:5000/api/superAdmin/featured-collections/positions/update',
        { positions },
        getAuthConfig()
      );
      return { positions, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update collection positions'
      );
    }
  }
);

// Create the slice
const featuredCollectionSlice = createSlice({
  name: 'featuredCollections',
  initialState,
  reducers: {
    resetFeaturedCollections: (state) => {
      state.collections = [];
      state.isLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all collections
      .addCase(fetchFeaturedCollections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedCollections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collections = action.payload.data;
      })
      .addCase(fetchFeaturedCollections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create collection
      .addCase(createFeaturedCollection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFeaturedCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collections.push(action.payload.data);
        // Sort collections by position
        state.collections.sort((a, b) => a.position - b.position);
      })
      .addCase(createFeaturedCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update collection
      .addCase(updateFeaturedCollection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFeaturedCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.collections.findIndex(
          (collection) => collection._id === action.payload.data._id
        );
        if (index !== -1) {
          state.collections[index] = action.payload.data;
        }
        // Sort collections by position
        state.collections.sort((a, b) => a.position - b.position);
      })
      .addCase(updateFeaturedCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete collection
      .addCase(deleteFeaturedCollection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteFeaturedCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collections = state.collections.filter(
          (collection) => collection._id !== action.payload.id
        );
      })
      .addCase(deleteFeaturedCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update positions
      .addCase(updateCollectionPositions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCollectionPositions.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update positions in local state
        action.payload.positions.forEach(({ id, position }) => {
          const collection = state.collections.find((c) => c._id === id);
          if (collection) {
            collection.position = position;
          }
        });
        // Sort collections by position
        state.collections.sort((a, b) => a.position - b.position);
      })
      .addCase(updateCollectionPositions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetFeaturedCollections } = featuredCollectionSlice.actions;
export default featuredCollectionSlice.reducer;
