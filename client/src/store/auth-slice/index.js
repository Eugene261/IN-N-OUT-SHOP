import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "@/config/api";

const initialState = {
    isAuthenticated : false,
    isLoading : true,
    user : null
}

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      // Use rejectWithValue to pass the error response data
      return rejectWithValue(error.response?.data || { message: 'Registration failed' });
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check-auth',
  async (_, { rejectWithValue }) => {
    try {
      console.log('CheckAuth: Starting authentication check...');
      const token = localStorage.getItem('token');
      console.log('CheckAuth: Token exists:', !!token);
      
      // If no token, immediately reject
      if (!token) {
        console.log('CheckAuth: No token found, rejecting');
        return rejectWithValue({ message: 'No token found' });
      }
      
      // Check if token is expired before making request
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          console.log('CheckAuth: Token is expired, clearing auth data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          return rejectWithValue({ message: 'Token expired', tokenExpired: true });
        }
      } catch (tokenError) {
        console.log('CheckAuth: Invalid token format, clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        return rejectWithValue({ message: 'Invalid token format' });
      }
      
      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      };
      
      console.log('CheckAuth: Making request to server...');
      const response = await axios.get(
        `${API_BASE_URL}/api/auth/check-auth`,
        config
      );
      
      console.log('CheckAuth: Success response:', response.data);
      return response.data;
    } catch (error) {
      console.log('CheckAuth error:', error.response?.status, error.message);
      console.log('CheckAuth error data:', error.response?.data);
      
      // If it's a 401 error, clear auth data
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      // Use rejectWithValue to pass the error response data
      return rejectWithValue(error.response?.data || { message: 'Authentication check failed' });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear localStorage immediately
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear cookies
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/logout`, {},
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.log('Logout error:', error.response?.status, error.message);
      // Even if server logout fails, we've cleared local data
      // Use rejectWithValue to pass the error response data
      return rejectWithValue(error.response?.data || { message: 'Logout failed' });
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      // Use rejectWithValue to pass the error response data
      return rejectWithValue(error.response?.data || { message: 'Login failed' });
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue, getState }) => {
    try {
      console.log('=== UPDATE PROFILE API CALL ===');
      console.log('Sending data:', formData);
      
      const { auth } = getState();
      const token = localStorage.getItem('token');
      const userId = auth.user?._id || auth.user?.id;
      
      console.log('Token:', token);
      console.log('User ID:', userId);
      console.log('Auth user:', auth.user);
      
      // Try multiple authentication approaches
      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // Add authorization header if token exists
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Try with user ID in URL first (more explicit)
      let response;
      
      if (userId) {
        console.log('Trying with user ID in URL:', userId);
        try {
          response = await axios.put(
            `${API_BASE_URL}/api/shop/user/profile/${userId}`,
            formData,
            config
          );
        } catch (error) {
          console.log('Failed with user ID, trying without:', error.response?.status);
          if (error.response?.status !== 404) {
            throw error; // Re-throw if not a 404
          }
          // Fall back to endpoint without user ID
          response = await axios.put(
            `${API_BASE_URL}/api/shop/user/profile`,
            formData,
            config
          );
        }
      } else {
        // No user ID available, use standard endpoint
        response = await axios.put(
          `${API_BASE_URL}/api/shop/user/profile`,
          formData,
          config
        );
      }
      
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      console.error('API Error response:', error.response?.data);
      console.error('API Error status:', error.response?.status);
      return rejectWithValue(error.response?.data || { message: 'Profile update failed' });
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/shop/user/profile`,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch profile' });
    }
  }
);

export const updateUserSettings = createAsyncThunk(
  'auth/updateSettings',
  async (settingsData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const userId = auth.user?._id || auth.user?.id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/shop/user/settings/${userId}`,
        settingsData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Settings update failed' });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
    /* Register */
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false; // You might want to change this
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Registration failed';
      })
      
      /* Login */
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.success ?  action.payload.user : null;
        state.isAuthenticated = action.payload.success ? true : false;
        
        // Store token in localStorage if login was successful
        if (action.payload.success && action.payload.token) {
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload?.message || 'Login failed';
      })

      /* Check-auth */
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.success ?  action.payload.user : null;
        state.isAuthenticated = action.payload.success  // You might want to change this
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        console.log('Auth slice - checkAuth rejected:', action.payload);
      })

      /* logout */
      .addCase(logoutUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;  // You might want to change this
      })

      /* Update Profile */
      .addCase(updateUserProfile.pending, (state) => {
        // Don't set global isLoading for profile updates to avoid affecting app loading state
        // state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        // Don't set global isLoading for profile updates
        // state.isLoading = false;
        console.log('Auth slice - updateUserProfile fulfilled:', action.payload);
        if (action.payload.success) {
          state.user = { ...state.user, ...action.payload.data };
          // Update localStorage with the new user data
          localStorage.setItem('user', JSON.stringify(state.user));
          console.log('Updated localStorage with new user data:', state.user);
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        // Don't set global isLoading for profile updates
        // state.isLoading = false;
        console.log('Auth slice - updateUserProfile rejected:', action.payload);
        state.error = action.payload?.message || 'Profile update failed';
      })

      /* Fetch Profile */
      .addCase(fetchUserProfile.pending, (state) => {
        // Don't set global isLoading for profile fetches to avoid infinite loops
        // state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        // Don't set global isLoading for profile fetches
        // state.isLoading = false;
        console.log('Auth slice - fetchUserProfile fulfilled:', action.payload);
        if (action.payload.success) {
          state.user = action.payload.data;
          // Update localStorage with the fetched user data
          localStorage.setItem('user', JSON.stringify(action.payload.data));
          console.log('Updated localStorage with fetched user data:', action.payload.data);
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        // Don't set global isLoading for profile fetches
        // state.isLoading = false;
        console.log('Auth slice - fetchUserProfile rejected:', action.payload);
        state.error = action.payload?.message || 'Failed to fetch profile';
      })

      /* Update Settings */
      .addCase(updateUserSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('Auth slice - updateUserSettings fulfilled:', action.payload);
        if (action.payload.success) {
          // Update user with the settings data from backend response
          state.user = { 
            ...state.user, 
            baseRegion: action.payload.data?.baseRegion,
            baseCity: action.payload.data?.baseCity,
            timezone: action.payload.data?.timezone,
            shippingPreferences: action.payload.data?.shippingPreferences
          };
        }
      })
      .addCase(updateUserSettings.rejected, (state, action) => {
        state.isLoading = false;
        console.log('Auth slice - updateUserSettings rejected:', action.payload);
        state.error = action.payload?.message || 'Settings update failed';
      });
  },
});

export const {setUser} = authSlice.actions;
export default authSlice.reducer;