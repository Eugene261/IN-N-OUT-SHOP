import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";



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
        'http://localhost:5000/api/auth/register',
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
  async ( ) => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/auth/check-auth',
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control' : 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Expires' : '0'
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


export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/logout', {},
        
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      // Use rejectWithValue to pass the error response data
      return rejectWithValue(error.response?.data || { message: 'Registration failed' });
    }
  }
);


export const loginUser = createAsyncThunk(
  'auth/login',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
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
        state.isAuthenticated = action.payload.success ? true : false; // You might want to change this
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
        
      })

      /* logout */

      .addCase(logoutUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;  // You might want to change this
      })
  },
});

export const {setUser} = authSlice.actions;
export default authSlice.reducer;