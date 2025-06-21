import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "@/config/api";

const initialState = {
  wishlistItems: [],
  isLoading: false,
  error: null
};

// Utility function to get or generate guest ID
const getGuestId = () => {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
};

// Add to wishlist (supports both authenticated and guest users)
export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async ({ userId, productId, guestId }, { rejectWithValue, getState }) => {
    // Validate inputs before making the API call
    if (!productId) {
      console.error("Missing required parameter: productId");
      return rejectWithValue("Product ID is required");
    }

    // Determine user identification
    let requestData = { productId };
    if (userId) {
      requestData.userId = userId;
    } else {
      requestData.guestId = guestId || getGuestId();
    }
    
    try {
      console.log("Adding to wishlist:", requestData);
      
      // Make the API call to add to wishlist
      const response = await axios.post(
        `${API_BASE_URL}/api/shop/wishlist/add`,
        requestData
      );

      if (response.data.success) {
        console.log("Wishlist add response:", response.data);
        
        // After successful add, fetch the complete updated wishlist
        let wishlistUrl = '';
        if (userId) {
          wishlistUrl = `${API_BASE_URL}/api/shop/wishlist/${userId}`;
        } else {
          const guestIdentifier = guestId || getGuestId();
          wishlistUrl = `${API_BASE_URL}/api/shop/wishlist/guest?guestId=${guestIdentifier}`;
        }
        
        const wishlistResponse = await axios.get(wishlistUrl);
        
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

// Remove from wishlist (supports both authenticated and guest users)
export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async ({ userId, productId, guestId }, { rejectWithValue }) => {
    // Validate inputs before making the API call
    if (!productId) {
      console.error("Missing required parameter: productId");
      return rejectWithValue("Product ID is required");
    }

    // Determine user identification
    let urlParams = '';
    if (userId) {
      urlParams = `/${userId}/${productId}`;
    } else {
      const guestIdentifier = guestId || localStorage.getItem('guestId');
      if (!guestIdentifier) {
        return rejectWithValue("Guest ID is required for non-authenticated users");
      }
      urlParams = `/guest/${productId}?guestId=${guestIdentifier}`;
    }
    
    try {
      console.log("Removing from wishlist:", { userId, productId, guestId });
      
      // Make the API call to remove from wishlist
      const response = await axios.delete(
        `${API_BASE_URL}/api/shop/wishlist/remove${urlParams}`
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

// Fetch wishlist items (supports both authenticated and guest users)
export const fetchWishlistItems = createAsyncThunk(
  "wishlist/fetchWishlistItems",
  async ({ userId, guestId }, { rejectWithValue }) => {
    // For guest users, use guestId; for authenticated users, use userId
    let urlParams = '';
    let identifier = '';
    
    if (userId) {
      urlParams = `/${userId}`;
      identifier = userId;
    } else {
      const guestIdentifier = guestId || localStorage.getItem('guestId');
      if (!guestIdentifier) {
        console.log("No user ID or guest ID provided for fetchWishlistItems, returning empty array");
        return { data: [] };
      }
      urlParams = `/guest?guestId=${guestIdentifier}`;
      identifier = guestIdentifier;
    }

    try {
      console.log("Fetching wishlist for:", identifier);
      const response = await axios.get(
        `${API_BASE_URL}/api/shop/wishlist${urlParams}`
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

// Migrate guest wishlist to user account when user logs in
export const migrateGuestWishlist = createAsyncThunk(
  "wishlist/migrateGuestWishlist",
  async ({ userId, guestId }, { rejectWithValue }) => {
    try {
      console.log("Migrating guest wishlist:", { userId, guestId });
      
      const response = await axios.post(
        `${API_BASE_URL}/api/shop/wishlist/migrate`,
        { userId, guestId }
      );
      
      console.log("Wishlist migration response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error migrating wishlist:", error);
      return rejectWithValue(error.response?.data || "Failed to migrate wishlist");
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
      })
      
      // Migrate guest wishlist
      .addCase(migrateGuestWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(migrateGuestWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wishlistItems = action.payload.data || [];
      })
      .addCase(migrateGuestWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to migrate wishlist";
      });
  },
});

export const { clearWishlist, addToWishlistOptimistic, removeFromWishlistOptimistic } = wishlistSlice.actions;
export default wishlistSlice.reducer;
