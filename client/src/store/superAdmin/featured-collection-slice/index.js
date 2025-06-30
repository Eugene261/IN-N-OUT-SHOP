import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

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
        `${API_BASE_URL}/api/superAdmin/featured-collections`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch collections');
    }
  }
);

// Create a new featured collection
export const createFeaturedCollection = createAsyncThunk(
  'featuredCollections/create',
  async (collectionData, { rejectWithValue }) => {
    try {
      console.log('Redux: Creating featured collection with data:', collectionData);
      console.log('Redux: Data type:', collectionData instanceof FormData ? 'FormData' : 'JSON');
      
      // Determine if we're sending FormData or JSON
      const isFormData = collectionData instanceof FormData;
      
      const config = {
        withCredentials: true,
        headers: {}
      };
      
      // Only set Content-Type for JSON data, let browser set it for FormData
      if (!isFormData) {
        config.headers['Content-Type'] = 'application/json';
      }
      
      console.log('Redux: Request config:', config);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/superAdmin/featured-collections`,
        collectionData,
        config
      );
      
      console.log('Redux: Create collection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Redux: Create collection error:', error);
      console.error('Redux: Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create collection';
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Update a featured collection
export const updateFeaturedCollection = createAsyncThunk(
  'featuredCollections/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      console.log('Redux: Updating featured collection:', id, 'with data:', data);
      console.log('Redux: Data type:', data instanceof FormData ? 'FormData' : 'JSON');
      
      // Determine if we're sending FormData or JSON
      const isFormData = data instanceof FormData;
      
      const config = {
        withCredentials: true,
        headers: {}
      };
      
      // Only set Content-Type for JSON data, let browser set it for FormData
      if (!isFormData) {
        config.headers['Content-Type'] = 'application/json';
      }
      
      console.log('Redux: Request config:', config);
      
      const response = await axios.put(
        `${API_BASE_URL}/api/superAdmin/featured-collections/${id}`,
        data,
        config
      );
      
      console.log('Redux: Update collection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Redux: Update collection error:', error);
      console.error('Redux: Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to update collection';
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Delete a featured collection
export const deleteFeaturedCollection = createAsyncThunk(
  'featuredCollections/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/superAdmin/featured-collections/${id}`,
        {
          withCredentials: true,
        }
      );
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete collection');
    }
  }
);

// Update collection positions
export const updateCollectionPositions = createAsyncThunk(
  'featuredCollections/updatePositions',
  async (collections, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/superAdmin/featured-collections/positions/update`,
        { collections },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update positions');
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
        state.collections = action.payload.data || [];
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
        if (action.payload.data) {
          state.collections.push(action.payload.data);
          // Sort collections by position
          state.collections.sort((a, b) => a.position - b.position);
        }
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
        if (action.payload.data) {
          const index = state.collections.findIndex(
            (collection) => collection._id === action.payload.data._id
          );
          if (index !== -1) {
            state.collections[index] = action.payload.data;
          }
          // Sort collections by position
          state.collections.sort((a, b) => a.position - b.position);
        }
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
        if (action.payload.positions && Array.isArray(action.payload.positions)) {
          action.payload.positions.forEach(({ id, position }) => {
            const collection = state.collections.find((c) => c._id === id);
            if (collection) {
              collection.position = position;
            }
          });
          // Sort collections by position
          state.collections.sort((a, b) => a.position - b.position);
        }
      })
      .addCase(updateCollectionPositions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetFeaturedCollections } = featuredCollectionSlice.actions;
export default featuredCollectionSlice.reducer;
