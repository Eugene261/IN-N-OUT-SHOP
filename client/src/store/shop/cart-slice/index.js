import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  cartItems: [],
  isLoading: false,
};

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, productId, quantity, size, color }, { rejectWithValue }) => {
    // Validate required parameters
    if (!userId || !productId) {
      console.error("Missing required parameters for addToCart:", { userId, productId });
      return rejectWithValue("User ID and Product ID are required");
    }
    
    try {
      console.log("Adding to cart:", { userId, productId, quantity, size, color });
      const response = await axios.post(
        "http://localhost:5000/api/shop/cart/add",
        {
          userId,
          productId,
          quantity: quantity || 1, // Default to 1 if not provided
          size,
          color
        }
      );
      
      console.log("Cart add response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error adding to cart:", error);
      console.error("Error response data:", error.response?.data);
      return rejectWithValue(error.response?.data || "Failed to add to cart");
    }
  }
);

export const fetchCartItems = createAsyncThunk(
  "cart/fetchCartItems",
  async (userId, { rejectWithValue }) => {
    if (!userId) {
      console.log("No user ID provided for fetchCartItems, returning empty cart");
      return { data: { items: [] } };
    }
    
    try {
      console.log("Fetching cart for user:", userId);
      const response = await axios.get(
        `http://localhost:5000/api/shop/cart/get/${userId}`
      );
      console.log("Cart fetch response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching cart:", error);
      console.error("Error response data:", error.response?.data);
      return rejectWithValue(error.response?.data || "Failed to fetch cart items");
    }
  }
);

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async ({ userId, productId, size, color }, { rejectWithValue }) => {
    // Validate required parameters
    if (!userId || !productId) {
      console.error("Missing required parameters for deleteCartItem:", { userId, productId });
      return rejectWithValue("User ID and Product ID are required");
    }
    
    try {
      console.log("Removing from cart:", { userId, productId, size, color });
      const response = await axios.delete(
        `http://localhost:5000/api/shop/cart/${userId}/${productId}?size=${size || ''}&color=${color || ''}`
      );
      
      console.log("Cart delete response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error removing from cart:", error);
      console.error("Error response data:", error.response?.data);
      return rejectWithValue(error.response?.data || "Failed to remove item from cart");
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  "cart/updateCartQuantity",
  async ({ userId, productId, quantity, size, color }, { rejectWithValue }) => {
    // Validate required parameters
    if (!userId || !productId) {
      console.error("Missing required parameters for updateCartQuantity:", { userId, productId });
      return rejectWithValue("User ID and Product ID are required");
    }
    
    if (quantity < 1) {
      console.error("Invalid quantity for updateCartQuantity:", quantity);
      return rejectWithValue("Quantity must be at least 1");
    }
    
    try {
      console.log("Updating cart quantity:", { userId, productId, quantity, size, color });
      const response = await axios.put(
        "http://localhost:5000/api/shop/cart/update-cart",
        {
          userId,
          productId,
          quantity,
          size,
          color
        }
      );
      
      console.log("Cart update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      console.error("Error response data:", error.response?.data);
      return rejectWithValue(error.response?.data || "Failed to update cart quantity");
    }
  }
);

const shoppingCartSlice = createSlice({
  name: "shoppingCart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.data;
      })
      .addCase(addToCart.rejected, (state) => {
        state.isLoading = false;
        state.cartItems = [];
      })
      .addCase(fetchCartItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.data;
      })
      .addCase(fetchCartItems.rejected, (state) => {
        state.isLoading = false;
        state.cartItems = [];
      })
      .addCase(updateCartQuantity.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.data;
      })
      .addCase(updateCartQuantity.rejected, (state) => {
        state.isLoading = false;
        state.cartItems = [];
      })
      .addCase(deleteCartItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.data;
      })
      .addCase(deleteCartItem.rejected, (state) => {
        state.isLoading = false;
        state.cartItems = [];
      });
  },
});

export default shoppingCartSlice.reducer;
