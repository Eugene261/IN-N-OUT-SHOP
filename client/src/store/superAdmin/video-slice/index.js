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
  videos: [],
  currentVideo: null,
  isLoading: false,
  uploadProgress: 0,
  error: null,
  pagination: {
    current: 1,
    pages: 1,
    total: 0
  }
};

// Fetch all videos with pagination and filters
export const fetchVideos = createAsyncThunk(
  'superAdminVideos/fetchAll',
  async ({ page = 1, limit = 10, status, category, isFeatured } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      
      // Convert "all" values back to empty strings for backend compatibility
      const finalStatus = status === 'all' ? '' : status;
      const finalCategory = category === 'all' ? '' : category;
      const finalIsFeatured = isFeatured === 'all' ? '' : isFeatured;
      
      if (finalStatus && finalStatus.trim() !== '') params.append('status', finalStatus);
      if (finalCategory && finalCategory.trim() !== '') params.append('category', finalCategory);
      if (finalIsFeatured !== undefined && finalIsFeatured !== '' && finalIsFeatured !== null) params.append('isFeatured', finalIsFeatured);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdmin/videos?${params.toString()}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch videos');
    }
  }
);

// Fetch single video by ID
export const fetchVideoById = createAsyncThunk(
  'superAdminVideos/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdmin/videos/${id}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch video');
    }
  }
);

// Create a new video
export const createVideo = createAsyncThunk(
  'superAdminVideos/create',
  async (videoData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/superAdmin/videos`,
        videoData,
        getAuthConfig(true) // FormData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create video');
    }
  }
);

// Update a video
export const updateVideo = createAsyncThunk(
  'superAdminVideos/update',
  async ({ id, videoData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/superAdmin/videos/${id}`,
        videoData,
        getAuthConfig(true) // FormData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update video');
    }
  }
);

// Delete a video
export const deleteVideo = createAsyncThunk(
  'superAdminVideos/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/superAdmin/videos/${id}`,
        getAuthConfig()
      );
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete video');
    }
  }
);

// Toggle video featured status
export const toggleVideoFeatured = createAsyncThunk(
  'superAdminVideos/toggleFeatured',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/superAdmin/videos/${id}/featured`,
        {},
        getAuthConfig()
      );
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to toggle featured status');
    }
  }
);

// Update video priorities (bulk reordering)
export const updateVideoPriorities = createAsyncThunk(
  'superAdminVideos/updatePriorities',
  async (priorities, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/superAdmin/videos/priorities/update`,
        { priorities },
        getAuthConfig()
      );
      return { priorities, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update priorities');
    }
  }
);

// Create the slice
const superAdminVideoSlice = createSlice({
  name: 'superAdminVideos',
  initialState,
  reducers: {
    resetVideos: (state) => {
      state.videos = [];
      state.currentVideo = null;
      state.isLoading = false;
      state.uploadProgress = 0;
      state.error = null;
      state.pagination = { current: 1, pages: 1, total: 0 };
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentVideo: (state, action) => {
      state.currentVideo = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all videos
      .addCase(fetchVideos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos = action.payload.data;
        state.pagination = action.payload.pagination || { current: 1, pages: 1, total: 0 };
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch single video
      .addCase(fetchVideoById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentVideo = action.payload.data;
      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create video
      .addCase(createVideo.pending, (state) => {
        state.isLoading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(createVideo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.uploadProgress = 100;
        state.videos.unshift(action.payload.data);
      })
      .addCase(createVideo.rejected, (state, action) => {
        state.isLoading = false;
        state.uploadProgress = 0;
        state.error = action.payload;
      })
      
      // Update video
      .addCase(updateVideo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateVideo.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.videos.findIndex(
          (video) => video._id === action.payload.data._id
        );
        if (index !== -1) {
          state.videos[index] = action.payload.data;
        }
        if (state.currentVideo && state.currentVideo._id === action.payload.data._id) {
          state.currentVideo = action.payload.data;
        }
      })
      .addCase(updateVideo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete video
      .addCase(deleteVideo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos = state.videos.filter(
          (video) => video._id !== action.payload.id
        );
        if (state.currentVideo && state.currentVideo._id === action.payload.id) {
          state.currentVideo = null;
        }
      })
      .addCase(deleteVideo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Toggle featured status
      .addCase(toggleVideoFeatured.fulfilled, (state, action) => {
        const video = state.videos.find((v) => v._id === action.payload.id);
        if (video) {
          video.isFeatured = action.payload.data.isFeatured;
        }
        if (state.currentVideo && state.currentVideo._id === action.payload.id) {
          state.currentVideo.isFeatured = action.payload.data.isFeatured;
        }
      })
      
      // Update priorities
      .addCase(updateVideoPriorities.fulfilled, (state, action) => {
        // Update priorities in local state
        action.payload.priorities.forEach(({ id, priority }) => {
          const video = state.videos.find((v) => v._id === id);
          if (video) {
            video.priority = priority;
          }
        });
        // Sort videos by priority
        state.videos.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      });
  }
});

export const { resetVideos, setUploadProgress, clearError, setCurrentVideo } = superAdminVideoSlice.actions;
export default superAdminVideoSlice.reducer; 