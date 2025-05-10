import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  wishlistItems: [],
  isLoading: false,
  error: null
};

// Add to wishlist
export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async ({ userId, productId }, { rejectWithValue }) => {
    // Validate inputs before making the API call
    if (!userId || !productId) {
      console.error("Missing required parameters:", { userId, productId });
      return rejectWithValue("User ID and Product ID are required");
    }
    
    try {
      console.log("Adding to wishlist:", { userId, productId });
      // Make sure we're using the correct API endpoint format
      const response = await axios.post(
        "http://localhost:5000/api/shop/wishlist/add",
        {
          userId,
          productId
        }
      );
      console.log("Wishlist add response:", response.data);
      
      // Fetch the updated wishlist after adding an item
      try {
        const updatedWishlist = await axios.get(
          `http://localhost:5000/api/shop/wishlist/${userId}`
        );
        console.log("Updated wishlist after add:", updatedWishlist.data);
        
        // Return the updated wishlist data
        if (updatedWishlist.data && updatedWishlist.data.data) {
          return updatedWishlist.data;
        } else if (Array.isArray(updatedWishlist.data)) {
          return { data: updatedWishlist.data };
        } else {
          return response.data; // Fallback to original response
        }
      } catch (fetchError) {
        console.error("Error fetching updated wishlist after add:", fetchError);
        // If we can't fetch the updated list, return the original response
        return response.data;
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
      // Make sure we're using the correct API endpoint format
      const response = await axios.delete(
        `http://localhost:5000/api/shop/wishlist/remove/${userId}/${productId}`
      );
      console.log("Wishlist remove response:", response.data);
      
      // Fetch the updated wishlist after removing an item
      try {
        const updatedWishlist = await axios.get(
          `http://localhost:5000/api/shop/wishlist/${userId}`
        );
        console.log("Updated wishlist after remove:", updatedWishlist.data);
        
        // Return the updated wishlist data
        if (updatedWishlist.data && updatedWishlist.data.data) {
          return updatedWishlist.data;
        } else if (Array.isArray(updatedWishlist.data)) {
          return { data: updatedWishlist.data };
        } else {
          return { data: [] }; // Return empty array as fallback
        }
      } catch (fetchError) {
        console.error("Error fetching updated wishlist after remove:", fetchError);
        // If we can't fetch the updated list, return empty array to be safe
        return { data: [] };
      }
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
      // Use the correct API endpoint format that the backend expects
      const response = await axios.get(
        `http://localhost:5000/api/shop/wishlist/${userId}`
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

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
