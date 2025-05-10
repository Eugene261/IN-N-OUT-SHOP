import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configure axios with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
});

// Get all users
export const fetchAllUsers = createAsyncThunk(
  'superAdminUsers/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/superAdmin/users/all', {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

// Get users by role
export const fetchUsersByRole = createAsyncThunk(
  'superAdminUsers/fetchUsersByRole',
  async (role, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/superAdmin/users/role/${role}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users by role');
    }
  }
);

// Add a new user
export const addUser = createAsyncThunk(
  'superAdminUsers/addUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/superAdmin/users/add', userData, {
        withCredentials: true
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
      const response = await api.put(`/api/superAdmin/users/update-role/${userId}`, { role }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user role');
    }
  }
);

// Delete a user
export const deleteUser = createAsyncThunk(
  'superAdminUsers/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/superAdmin/users/delete/${userId}`, {
        withCredentials: true
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
  success: null,
  actionType: null
};

const superAdminUsersSlice = createSlice({
  name: 'superAdminUsers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
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
        state.users = action.payload.users;
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
        state.users = action.payload.users;
      })
      .addCase(fetchUsersByRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add user
      .addCase(addUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
        state.actionType = 'add';
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users.push(action.payload.user);
        state.success = action.payload.message;
        state.actionType = 'add';
      })
      .addCase(addUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.actionType = 'add';
      })
      
      // Update user role
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
        state.actionType = 'update';
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = action.payload.user;
        state.users = state.users.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        );
        state.success = action.payload.message;
        state.actionType = 'update';
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.actionType = 'update';
      })
      
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
        state.actionType = 'delete';
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter(user => user._id !== action.payload.userId);
        state.success = action.payload.message;
        state.actionType = 'delete';
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.actionType = 'delete';
      });
  }
});

export const { clearError, clearSuccess } = superAdminUsersSlice.actions;
export default superAdminUsersSlice.reducer;
