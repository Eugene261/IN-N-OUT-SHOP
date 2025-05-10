import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper function to get auth configuration with token
const getAuthConfig = () => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    return {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };
};

const initialState = {
    isLoading: false,
    isLoadingOrders: false,
    isUpdating: false,
    revenueStats: null,
    adminOrders: [],
    error: null
};

// Fetch revenue statistics for the logged-in admin
export const fetchRevenueStats = createAsyncThunk(
    'adminRevenue/fetchRevenueStats',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching revenue stats...');
            const response = await axios.get(
                'http://localhost:5000/api/admin/revenue/stats',
                getAuthConfig()
            );
            console.log('Revenue stats response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching revenue stats:', error);
            return rejectWithValue(error.response?.data || 'Failed to fetch revenue statistics');
        }
    }
);

// Fetch orders that contain products created by the logged-in admin
export const fetchAdminOrders = createAsyncThunk(
    'adminRevenue/fetchAdminOrders',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching admin orders...');
            const response = await axios.get(
                'http://localhost:5000/api/admin/revenue/orders',
                getAuthConfig()
            );
            console.log('Admin orders response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching admin orders:', error);
            return rejectWithValue(error.response?.data || 'Failed to fetch admin orders');
        }
    }
);

export const updateOrderStatus = createAsyncThunk(
    'adminRevenue/updateOrderStatus',
    async ({ orderId, status }, { rejectWithValue }) => {
        try {
            console.log(`Updating order ${orderId} status to ${status}...`);
            const response = await axios.put(
                `http://localhost:5000/api/admin/orders/update-status/${orderId}`,
                { status },
                getAuthConfig()
            );
            console.log('Update order status response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error updating order status:', error);
            return rejectWithValue(error.response?.data || 'Failed to update order status');
        }
    }
);

const adminRevenueSlice = createSlice({
    name: 'adminRevenue',
    initialState,
    reducers: {
        resetRevenueState: (state) => {
            state.revenueStats = null;
            state.adminOrders = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch revenue statistics
            .addCase(fetchRevenueStats.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchRevenueStats.fulfilled, (state, action) => {
                state.isLoading = false;
                state.revenueStats = action.payload.data;
            })
            .addCase(fetchRevenueStats.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload?.message || 'Failed to fetch revenue stats';
            })
            
            // Fetch admin orders
            .addCase(fetchAdminOrders.pending, (state) => {
                state.isLoadingOrders = true;
                state.error = null;
            })
            .addCase(fetchAdminOrders.fulfilled, (state, action) => {
                state.isLoadingOrders = false;
                state.adminOrders = action.payload.data;
            })
            .addCase(fetchAdminOrders.rejected, (state, action) => {
                state.isLoadingOrders = false;
                state.error = action.payload?.message || 'Failed to fetch admin orders';
            })
            
            // Update order status
            .addCase(updateOrderStatus.pending, (state) => {
                state.isUpdating = true;
                state.error = null;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                state.isUpdating = false;
                // Update the order in the adminOrders array
                const updatedOrder = action.payload.data;
                state.adminOrders = state.adminOrders.map(order => 
                  order._id === updatedOrder._id ? updatedOrder : order
                );
                
                // Force a full refresh of the revenue stats instead of trying to update them manually
                // This ensures the dashboard numbers are always in sync with the backend
                // The fetchRevenueStats action will be dispatched separately
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload?.message || 'Failed to update order status';
            });
    }
});

export const { resetRevenueState } = adminRevenueSlice.actions;
export default adminRevenueSlice.reducer;
