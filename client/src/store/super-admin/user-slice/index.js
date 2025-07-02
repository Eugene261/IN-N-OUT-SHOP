import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get all users
export const fetchAllUsers = createAsyncThunk(
  'superAdminUsers/fetchAllUsers',
  async ({ page = 1, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/superAdmin/users/all`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

// Get users by role - FIXED PARAMETER HANDLING
export const fetchUsersByRole = createAsyncThunk(
  'superAdminUsers/fetchUsersByRole',
  async (params, { rejectWithValue }) => {
    try {
      // Handle both object and string parameters for backward compatibility
      const role = typeof params === 'string' ? params : params?.role;
      
      if (!role || !['user', 'admin', 'superAdmin'].includes(role)) {
        return rejectWithValue('Invalid role specified');
      }

      console.log('🔍 Fetching users by role:', role);

      const response = await axios.get(`${API_URL}/api/superAdmin/users/role/${role}`, {
        params: {
          page: typeof params === 'object' ? params.page : 1,
          limit: typeof params === 'object' ? params.limit : 20
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching users by role:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users by role');
    }
  }
);

// Add new user
export const addUser = createAsyncThunk(
  'superAdminUsers/addUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/superAdmin/users/add`, userData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add user');
    }
  }
);

// Update user role
export const updateUserRole = createAsyncThunk(
  'superAdminUsers/updateUserRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/superAdmin/users/update-role/${userId}`, 
        { role }, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user role');
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  'superAdminUsers/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/api/superAdmin/users/delete/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return { ...response.data, userId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

const initialState = {
  users: [],
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  }
};

const superAdminUsersSlice = createSlice({
  name: 'superAdminUsers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUsers: (state) => {
      state.users = [];
      state.pagination = initialState.pagination;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch users by role
      .addCase(fetchUsersByRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsersByRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchUsersByRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add user
      .addCase(addUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.user) {
          state.users.push(action.payload.user);
        }
      })
      .addCase(addUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update user role
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.user) {
          const index = state.users.findIndex(user => user._id === action.payload.user._id);
          if (index !== -1) {
            state.users[index] = { ...state.users[index], ...action.payload.user };
          }
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.userId) {
          state.users = state.users.filter(user => user._id !== action.payload.userId);
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearUsers } = superAdminUsersSlice.actions;
export default superAdminUsersSlice.reducer;
