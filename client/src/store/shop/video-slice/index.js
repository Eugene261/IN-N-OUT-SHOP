import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Initial state
const initialState = {
  featuredVideos: [],
  videos: [],
  currentVideo: null,
  videoLikes: {}, // videoId: { isLiked: boolean, count: number }
  videoComments: {}, // videoId: comments[]
  isLoading: false,
  error: null,
  pagination: {
    current: 1,
    pages: 1,
    total: 0
  }
};

// Fetch featured videos for homepage
export const fetchFeaturedVideos = createAsyncThunk(
  'shopVideos/fetchFeatured',
  async ({ limit = 6 } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/shop/videos/featured?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch featured videos');
    }
  }
);

// Fetch published videos with pagination and filters
export const fetchPublishedVideos = createAsyncThunk(
  'shopVideos/fetchPublished',
  async ({ page = 1, limit = 12, category, tags } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (category) params.append('category', category);
      if (tags) params.append('tags', tags);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/shop/videos/published?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch videos');
    }
  }
);

// Fetch single video by ID
export const fetchVideoById = createAsyncThunk(
  'shopVideos/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/shop/videos/${id}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch video');
    }
  }
);

// Toggle video like (supports both authenticated and guest users)
export const toggleVideoLike = createAsyncThunk(
  'shopVideos/toggleLike',
  async ({ videoId, guestId }, { rejectWithValue }) => {
    try {
      const payload = {};
      if (guestId) payload.guestId = guestId;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/shop/videos/${videoId}/like`,
        payload,
        { withCredentials: true }
      );
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to toggle like');
    }
  }
);

// Add comment to video (supports both authenticated and guest users)
export const addVideoComment = createAsyncThunk(
  'shopVideos/addComment',
  async ({ videoId, text, guestId }, { rejectWithValue }) => {
    try {
      const payload = { text };
      if (guestId) payload.guestId = guestId;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/shop/videos/${videoId}/comment`,
        payload,
        { withCredentials: true }
      );
      return { videoId, comment: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add comment');
    }
  }
);

// Fetch video comments
export const fetchVideoComments = createAsyncThunk(
  'shopVideos/fetchComments',
  async ({ videoId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/shop/videos/${videoId}/comments?page=${page}&limit=${limit}`
      );
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch comments');
    }
  }
);

// Track video view
export const trackVideoView = createAsyncThunk(
  'shopVideos/trackView',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/shop/videos/${videoId}/view`
      );
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to track view');
    }
  }
);

// Fetch products tagged in video
export const fetchVideoProducts = createAsyncThunk(
  'shopVideos/fetchProducts',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/shop/videos/${videoId}/products`
      );
      return { videoId, products: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch video products');
    }
  }
);

// Create the slice
const shopVideoSlice = createSlice({
  name: 'shopVideos',
  initialState,
  reducers: {
    resetVideos: (state) => {
      state.featuredVideos = [];
      state.videos = [];
      state.currentVideo = null;
      state.videoLikes = {};
      state.videoComments = {};
      state.isLoading = false;
      state.error = null;
      state.pagination = { current: 1, pages: 1, total: 0 };
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentVideo: (state, action) => {
      state.currentVideo = action.payload;
    },
    // Optimistic UI update for likes
    optimisticToggleLike: (state, action) => {
      const { videoId } = action.payload;
      if (!state.videoLikes[videoId]) {
        state.videoLikes[videoId] = { isLiked: false, count: 0 };
      }
      const current = state.videoLikes[videoId];
      state.videoLikes[videoId] = {
        isLiked: !current.isLiked,
        count: current.isLiked ? current.count - 1 : current.count + 1
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch featured videos
      .addCase(fetchFeaturedVideos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredVideos = action.payload.data;
      })
      .addCase(fetchFeaturedVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch published videos
      .addCase(fetchPublishedVideos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublishedVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        const newVideos = action.payload.data;
        
        // If it's page 1, replace the videos, otherwise append
        if (action.payload.pagination?.current === 1) {
          state.videos = newVideos;
        } else {
          state.videos.push(...newVideos);
        }
        
        state.pagination = action.payload.pagination || { current: 1, pages: 1, total: 0 };
      })
      .addCase(fetchPublishedVideos.rejected, (state, action) => {
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
        
        // Initialize like state for this video
        const video = action.payload.data;
        state.videoLikes[video._id] = {
          isLiked: false, // Will be determined by checking user's like status
          count: video.likeCount || 0
        };
      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Toggle video like
      .addCase(toggleVideoLike.fulfilled, (state, action) => {
        const { videoId, data } = action.payload;
        state.videoLikes[videoId] = {
          isLiked: data.isLiked,
          count: data.likeCount
        };
        
        // Update current video if it matches
        if (state.currentVideo && state.currentVideo._id === videoId) {
          state.currentVideo.likeCount = data.likeCount;
        }
        
        // Update in featured videos
        const featuredVideo = state.featuredVideos.find(v => v._id === videoId);
        if (featuredVideo) {
          featuredVideo.likeCount = data.likeCount;
        }
        
        // Update in videos list
        const video = state.videos.find(v => v._id === videoId);
        if (video) {
          video.likeCount = data.likeCount;
        }
      })
      
      // Add video comment
      .addCase(addVideoComment.fulfilled, (state, action) => {
        const { videoId, comment } = action.payload;
        if (!state.videoComments[videoId]) {
          state.videoComments[videoId] = [];
        }
        state.videoComments[videoId].unshift(comment);
        
        // Update current video comment count
        if (state.currentVideo && state.currentVideo._id === videoId) {
          state.currentVideo.commentCount = (state.currentVideo.commentCount || 0) + 1;
        }
      })
      
      // Fetch video comments
      .addCase(fetchVideoComments.fulfilled, (state, action) => {
        const { videoId, data, pagination } = action.payload;
        
        // If it's page 1, replace comments, otherwise append
        if (pagination?.current === 1) {
          state.videoComments[videoId] = data;
        } else {
          if (!state.videoComments[videoId]) {
            state.videoComments[videoId] = [];
          }
          state.videoComments[videoId].push(...data);
        }
      })
      
      // Track video view
      .addCase(trackVideoView.fulfilled, (state, action) => {
        const { videoId, data } = action.payload;
        
        // Update current video if it matches
        if (state.currentVideo && state.currentVideo._id === videoId) {
          state.currentVideo.views = data.views;
        }
        
        // Update in featured videos
        const featuredVideo = state.featuredVideos.find(v => v._id === videoId);
        if (featuredVideo) {
          featuredVideo.views = data.views;
        }
        
        // Update in videos list
        const video = state.videos.find(v => v._id === videoId);
        if (video) {
          video.views = data.views;
        }
      });
  }
});

export const { resetVideos, clearError, setCurrentVideo, optimisticToggleLike } = shopVideoSlice.actions;
export default shopVideoSlice.reducer; 