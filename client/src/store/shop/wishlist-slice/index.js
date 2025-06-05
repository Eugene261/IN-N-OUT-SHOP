import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "@/config/api";

const initialState = {
  wishlistItems: [],
  isLoading: false,
  error: null
};

// Add to wishlist
export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async ({ userId, productId }, { rejectWithValue, getState }) => {
    // Validate inputs before making the API call
    if (!userId || !productId) {
      console.error("Missing required parameters:", { userId, productId });
      return rejectWithValue("User ID and Product ID are required");
    }
    
    try {
      console.log("Adding to wishlist:", { userId, productId });
      
      // Make the API call to add to wishlist
      const response = await axios.post(
        `${API_BASE_URL}/api/shop/wishlist/add`,
        { userId, productId }
      );

      if (response.data.success) {
        console.log("Wishlist add response:", response.data);
        
        // After successful add, fetch the complete updated wishlist
        const wishlistResponse = await axios.get(
          `${API_BASE_URL}/api/shop/wishlist/${userId}`
        );
        
        return wishlistResponse.data;
      } else {
        return rejectWithValue(response.data.message || 'Failed to add to wishlist');
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      console.error("Error response data:", error.response?.data);
      
      // Check if the error is because the item is already in the wishlist
      if (error.response?.data?.message?.includes("already in wishlist")) {
        return rejectWithValue({ message: "Product already in wishlist" });
      }
      
      return rejectWithValue(error.response?.data || "Failed to add to wishlist");
    }
  }
);

// Remove from wishlist
export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async ({ userId, productId }, { rejectWithValue }) => {
    // Validate inputs before making the API call
    if (!userId || !productId) {
      console.error("Missing required parameters:", { userId, productId });
      return rejectWithValue("User ID and Product ID are required");
    }
    
    try {
      console.log("Removing from wishlist:", { userId, productId });
      
      // Make the API call to remove from wishlist
      const response = await axios.delete(
        `${API_BASE_URL}/api/shop/wishlist/remove/${userId}/${productId}`
      );
      console.log("Wishlist remove response:", response.data);
      
      return response.data;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      console.error("Error response data:", error.response?.data);
      // Return empty array on error to prevent UI crashes
      return { data: [] };
    }
  }
);

// Fetch wishlist items
export const fetchWishlistItems = createAsyncThunk(
  "wishlist/fetchWishlistItems",
  async (userId, { rejectWithValue }) => {
    if (!userId) {
      console.log("No user ID provided for fetchWishlistItems, returning empty array");
      return { data: [] };
    }
    try {
      console.log("Fetching wishlist for user:", userId);
      const response = await axios.get(
        `${API_BASE_URL}/api/shop/wishlist/${userId}`
      );
      console.log("Wishlist fetch response:", response.data);
      
      // Ensure we return a consistent data structure even if the API response format varies
      if (response.data && response.data.data) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return { data: response.data };
      } else {
        return { data: [] };
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      console.error("Error response data:", error.response?.data);
      // Return an empty array on error to prevent UI crashes
      return { data: [] };
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.wishlistItems = [];
    },
    // Add optimistic update reducers for immediate UI feedback
    addToWishlistOptimistic: (state, action) => {
      const { productId } = action.payload;
      // Check if already exists to prevent duplicates
      const exists = state.wishlistItems.some(item => 
        item.productId === productId || item.productId?._id === productId
      );
      if (!exists) {
        state.wishlistItems.push({ productId, _id: productId });
      }
    },
    removeFromWishlistOptimistic: (state, action) => {
      const { productId } = action.payload;
      state.wishlistItems = state.wishlistItems.filter(item => 
        item.productId !== productId && item.productId?._id !== productId
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wishlistItems = action.payload.data || [];
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to add to wishlist";
      })
      
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wishlistItems = action.payload.data || [];
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to remove from wishlist";
      })
      
      // Fetch wishlist items
      .addCase(fetchWishlistItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlistItems.fulfilled, (state, action) => {
        state.isLoading = false;
        // Ensure we properly handle the response data structure
        if (action.payload && action.payload.data) {
          state.wishlistItems = action.payload.data;
          console.log('Wishlist items loaded:', action.payload.data.length);
        } else if (Array.isArray(action.payload)) {
          state.wishlistItems = action.payload;
          console.log('Wishlist items loaded (array):', action.payload.length);
        } else {
          console.error('Unexpected wishlist data format:', action.payload);
          state.wishlistItems = [];
        }
      })
      .addCase(fetchWishlistItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch wishlist";
      });
  },
});

export const { clearWishlist, addToWishlistOptimistic, removeFromWishlistOptimistic } = wishlistSlice.actions;
export default wishlistSlice.reducer;
