import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Helper function to retrieve cart from localStorage with user validation
const getLocalCart = () => {
  try {
    // Get both the cart and the stored userId
    const localCart = localStorage.getItem('userCart');
    const storedUserId = localStorage.getItem('cartUserId');
    const currentSession = localStorage.getItem('sessionActive');
    
    // Get the current user ID from localStorage (set during auth)
    const currentUserId = localStorage.getItem('currentUserId');
    
    if (localCart && storedUserId && currentUserId && storedUserId === currentUserId && currentSession === 'true') {
      console.log('Found valid local cart for current user');
      return JSON.parse(localCart);
    } else if (localCart && (!storedUserId || storedUserId !== currentUserId)) {
      console.log('Found local cart but user IDs don\'t match, not using local cart');
      // Don't use a cart that belongs to a different user
      return null;
    }
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
  }
  return null;
};

// Initialize state with localStorage data if available
const localCart = getLocalCart();

// CRITICAL FIX: Ensure proper cart data structure initialization
// The cartItems should be an object with an 'items' array inside it
const initialState = {
  cartItems: localCart ? { items: localCart } : { items: [] },
  isLoading: false,
  isCartOpen: false, // State to control cart visibility
  lastFetched: null, // Track when cart was last fetched from server
};

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, productId, quantity, size, color, price, title, image }, { rejectWithValue }) => {
    // Note: salePrice parameter removed to align with backend changes
    // Validate required parameters
    if (!userId || !productId) {
      console.error("Missing required parameters for addToCart:", { userId, productId });
      return rejectWithValue("User ID and Product ID are required");
    }
    
    try {
      console.log("Adding to cart:", { userId, productId, quantity, size, color, price, title, image });
      const response = await axios.post(
        "http://localhost:5000/api/shop/cart/add",
        {
          userId,
          productId,
          quantity: quantity || 1, // Default to 1 if not provided
          size,
          color,
          price, // Include price data - the actual purchase price
          title, // Include product title
          image // Include product image
          // salePrice removed as we no longer use it
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
  async (userId, { rejectWithValue, getState }) => {
    if (!userId) {
      console.log("No user ID provided for fetchCartItems, returning empty cart");
      return { data: { items: [] } };
    }
    
    // Store the current user ID for cart ownership validation
    localStorage.setItem('currentUserId', userId);
    localStorage.setItem('sessionActive', 'true');
    
    // First check if we're on the order confirmation page
    const isOrderConfirmationPage = window.location.pathname.includes('/shop/order-confirmation');
    
    // Only check for cartEmptyAfterOrder if we're NOT on the order confirmation page
    if (!isOrderConfirmationPage) {
      // Clear these flags when not on the order confirmation page
      // This ensures cart persistence across normal page navigation
      localStorage.removeItem('cartEmptyAfterOrder');
      sessionStorage.removeItem('cartEmptyAfterOrder');
    }
    
    try {
      // Check if we have a cached version in localStorage first
      const localCart = getLocalCart();
      const lastFetched = getState().shopCart.lastFetched;
      const now = new Date().getTime();
      
      // Use local cart as fallback if server fetch fails
      let fallbackCart = { data: { items: localCart || [] } };
      
      // If cartEmptyAfterOrder is set and we're on the confirmation page, respect it
      const cartEmptyAfterOrder = 
        (localStorage.getItem('cartEmptyAfterOrder') === 'true' || 
         sessionStorage.getItem('cartEmptyAfterOrder') === 'true') && 
        isOrderConfirmationPage;
      
      if (cartEmptyAfterOrder) {
        console.log('Cart should be empty after order, returning empty cart');
        return { data: { items: [] } };
      }
      
      // If we have a local cart and it was fetched recently (within 5 minutes), use it
      // This prevents unnecessary API calls on frequent page refreshes
      if (localCart && lastFetched && (now - lastFetched < 300000)) {
        console.log("Using recent locally cached cart");
        // CRITICAL FIX: Ensure consistent data structure
        return { data: { items: localCart } };
      }
      
      console.log("Fetching cart from server for user:", userId);
      const response = await axios.get(
        `http://localhost:5000/api/shop/cart/get/${userId}`
      );
      
      console.log("Cart fetch response:", response.data);
      
      // Save fetched cart to localStorage with user ownership
      if (response.data && response.data.data && response.data.data.items) {
        try {
          console.log('Saving cart to localStorage:', response.data.data.items);
          localStorage.setItem('userCart', JSON.stringify(response.data.data.items));
          localStorage.setItem('cartUserId', userId); // Store user ID with cart
        } catch (err) {
          console.error('Error saving cart to localStorage:', err);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("Error fetching cart:", error);
      console.error("Error response data:", error.response?.data);
      
      // If we have a local cart, use it as fallback
      const localCart = getLocalCart();
      if (localCart) {
        console.log("Using local cart as fallback after fetch error");
        // CRITICAL FIX: Ensure consistent data structure
        return { data: { items: localCart } };
      }
      
      return rejectWithValue(error.response?.data || "Failed to fetch cart items");
    }
  }
);

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async ({ userId, productId, size, color }, { rejectWithValue, getState }) => {
    // Validate required parameters
    if (!userId || !productId) {
      console.error("Missing required parameters for deleteCartItem:", { userId, productId });
      return rejectWithValue("User ID and Product ID are required");
    }
    
    try {
      console.log("Removing from cart:", { userId, productId, size, color });
      
      // First update localStorage to maintain consistency across refreshes
      try {
        // Get the current cart from localStorage
        const localCartData = localStorage.getItem('userCart');
        if (localCartData) {
          const localCart = JSON.parse(localCartData);
          
          // Find and remove the specific item from the local cart
          const updatedLocalCart = localCart.filter(item => 
            !(item.productId === productId && item.size === size && item.color === color)
          );
          
          // Update localStorage with the filtered cart
          localStorage.setItem('userCart', JSON.stringify(updatedLocalCart));
          console.log('Updated localStorage after item removal');
        }
      } catch (err) {
        console.error('Error updating localStorage during item removal:', err);
      }
      
      // Then proceed with server-side removal
      const response = await axios.delete(
        `http://localhost:5000/api/shop/cart/${userId}/${productId}?size=${size || ''}&color=${color || ''}`
      );
      
      console.log("Cart delete response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error removing from cart:", error);
      console.error("Error response data:", error.response?.data);
      
      // Even if the server request fails, keep the local cart updated
      // This ensures consistent behavior on page refresh
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

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (userId, { rejectWithValue }) => {
    if (!userId) {
      console.log("No user ID provided for clearCart");
      // Instead of rejecting, just return an empty cart
      return { success: true, data: { items: [] } };
    }
    
    try {
      console.log("Clearing cart for user:", userId);
      
      // Only clear localStorage cart if it belongs to current user
      const storedCartUserId = localStorage.getItem('cartUserId');
      if (storedCartUserId === userId) {
        localStorage.removeItem('userCart');
      }
      
      // Use the POST endpoint instead of DELETE to avoid URL parameter issues
      const response = await axios.post(
        `http://localhost:5000/api/shop/cart/clear`,
        { userId }
      );
      console.log("Cart clear response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error clearing cart:", error);
      console.error("Error response data:", error.response?.data);
      // Return empty cart even on error to ensure UI is cleared
      return { success: true, data: { items: [] } };
    }
  }
);

const shoppingCartSlice = createSlice({
  name: "shopCart",
  initialState,
  reducers: {
    clearCartState(state) {
      // CRITICAL FIX: Ensure consistent data structure with empty items array
      state.cartItems = { items: [] };
      state.isLoading = false;
      
      // Only clear localStorage cart if it belongs to current user
      try {
        const storedCartUserId = localStorage.getItem('cartUserId');
        const currentUserId = localStorage.getItem('currentUserId');
        
        if (storedCartUserId && currentUserId && storedCartUserId === currentUserId) {
          // Only clear if we're on order confirmation page or have the flag set
          const isOrderConfirmationPage = window.location.pathname.includes('/shop/order-confirmation');
          const cartEmptyAfterOrder = 
            localStorage.getItem('cartEmptyAfterOrder') === 'true' || 
            sessionStorage.getItem('cartEmptyAfterOrder') === 'true';
          
          if (isOrderConfirmationPage || cartEmptyAfterOrder) {
            localStorage.removeItem('userCart');
          }
        }
      } catch (err) {
        console.error('Error handling localStorage in clearCartState:', err);
      }
    },
    openCart(state) {
      state.isCartOpen = true;
    },
    closeCart(state) {
      state.isCartOpen = false;
    },
    toggleCart(state) {
      state.isCartOpen = !state.isCartOpen;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Ensure correct data structure in the state
        state.cartItems = action.payload.data;
        
        // Update localStorage with cart data to ensure persistence
        try {
          if (action.payload.data && action.payload.data.items) {
            // Save to localStorage as a backup for multi-vendor cart reliability
            localStorage.setItem('userCart', JSON.stringify(action.payload.data.items));
            console.log('Updated localStorage with cart items after add');
            
            // Store the current user ID
            const currentUserId = localStorage.getItem('currentUserId');
            if (currentUserId) {
              localStorage.setItem('cartUserId', currentUserId);
            }
          }
        } catch (err) {
          console.error('Error updating localStorage in addToCart reducer:', err);
        }
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
        state.lastFetched = new Date().getTime();
        
        // Save to localStorage as backup with user ownership
        try {
          if (action.payload.data && action.payload.data.items) {
            localStorage.setItem('userCart', JSON.stringify(action.payload.data.items));
            
            // Store the current user ID if we don't already have it
            const currentUserId = localStorage.getItem('currentUserId');
            if (currentUserId) {
              localStorage.setItem('cartUserId', currentUserId);
            }
          }
        } catch (err) {
          console.error('Error saving cart to localStorage in reducer:', err);
        }
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
        
        // We already update localStorage in the thunk, but this ensures state consistency
        try {
          if (action.payload.data && action.payload.data.items) {
            // Update localStorage with the new cart state after item removal
            localStorage.setItem('userCart', JSON.stringify(action.payload.data.items));
          }
        } catch (err) {
          console.error('Error updating localStorage after item removal in reducer:', err);
        }
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.isLoading = false;
        
        // Don't reset the entire cart on rejection, this preserves partial cart state
        // The thunk already updated localStorage for the removed item
      })
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isLoading = false;
        state.cartItems = [];
      })
      .addCase(clearCart.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearCartState, openCart, closeCart, toggleCart } = shoppingCartSlice.actions;
export default shoppingCartSlice.reducer;
