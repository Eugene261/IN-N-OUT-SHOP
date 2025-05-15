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

// Configure axios with base URL and auth
const api = axios.create({
    baseURL: 'http://localhost:5000'
});

// Add request interceptor to include auth token in every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.withCredentials = true;
    return config;
});

const initialState = {
    isLoading: false,
    isLoadingOrders: false,
    isUpdating: false,
    revenueStats: null,
    adminOrders: [],
    // Time-based revenue data
    dailyRevenue: [],
    weeklyRevenue: [],
    monthlyRevenue: [],
    yearlyRevenue: [],
    error: null
};

// Fetch revenue statistics for the logged-in admin
export const fetchRevenueStats = createAsyncThunk(
    'adminRevenue/fetchRevenueStats',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching revenue stats...');
            const response = await api.get('/api/admin/revenue/stats');
            console.log('Revenue stats response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching revenue stats:', error);
            return rejectWithValue(error.response?.data || 'Failed to fetch revenue statistics');
        }
    }
);

// Fetch time-based revenue data for the logged-in admin
export const fetchAdminRevenue = createAsyncThunk(
    'adminRevenue/fetchAdminRevenue',
    async (timeUnit, { rejectWithValue }) => {
        try {
            console.log(`Fetching admin ${timeUnit} revenue data...`);
            
            const response = await api.get(`/api/admin/revenue/${timeUnit}`);
            
            console.log(`Admin ${timeUnit} revenue data:`, response.data);
            return { timeUnit, data: response.data };
        } catch (error) {
            console.error(`Error fetching admin ${timeUnit} revenue:`, error);
            return rejectWithValue(error.response?.data || `Failed to fetch ${timeUnit} revenue data`);
        }
    }
);

// Fetch all revenue data in a single call
export const fetchAllAdminRevenue = createAsyncThunk(
    'adminRevenue/fetchAllAdminRevenue',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching all admin revenue data in a single call...');
            
            // Make a single API call to get all revenue data
            const response = await api.get('/api/admin/revenue/all/revenue-data');
            console.log('All admin revenue data:', response.data);
            
            // Return the data directly
            return response.data;
        } catch (error) {
            console.error('Error fetching all admin revenue:', error);
            return rejectWithValue('Failed to fetch admin revenue data');
        }
    }
);

// Fetch orders that contain products created by the logged-in admin
export const fetchAdminOrders = createAsyncThunk(
    'adminRevenue/fetchAdminOrders',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching admin orders...');
            const response = await api.get('/api/admin/revenue/orders');
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
            const response = await api.put(
                `/api/admin/orders/update-status/${orderId}`,
                { status }
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
            state.dailyRevenue = [];
            state.weeklyRevenue = [];
            state.monthlyRevenue = [];
            state.yearlyRevenue = [];
            state.error = null;
        },
        resetLoadingState: (state) => {
            console.log('Resetting all loading states');
            state.isLoading = false;
            state.isLoadingOrders = false;
            state.isUpdating = false;
            state.error = null;
            
            // Force a small update to all data arrays to trigger re-renders
            if (state.dailyRevenue && state.dailyRevenue.length > 0) {
                state.dailyRevenue = [...state.dailyRevenue];
            }
            if (state.weeklyRevenue && state.weeklyRevenue.length > 0) {
                state.weeklyRevenue = [...state.weeklyRevenue];
            }
            if (state.monthlyRevenue && state.monthlyRevenue.length > 0) {
                state.monthlyRevenue = [...state.monthlyRevenue];
            }
            if (state.yearlyRevenue && state.yearlyRevenue.length > 0) {
                state.yearlyRevenue = [...state.yearlyRevenue];
            }
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
                
                // Log what we're receiving from the API
                console.log('Raw API response for revenue stats:', action.payload);
                
                // Properly extract and normalize the data structure
                // Handle both possible API response structures
                if (action.payload && action.payload.success) {
                    // Store the data directly, without nesting it under 'data' again
                    // This fixes the double nesting problem
                    state.revenueStats = action.payload.data || {};
                    console.log('Normalized revenue stats data:', state.revenueStats);
                } else {
                    // Fallback if different structure
                    state.revenueStats = action.payload || {};
                    console.log('Using fallback structure for revenue stats');
                }
            })
            .addCase(fetchRevenueStats.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload?.message || 'Failed to fetch revenue stats';
            })
            
            // Fetch time-based revenue data
            .addCase(fetchAdminRevenue.pending, (state, action) => {
                // Don't set global loading state to true for individual time unit fetches
                // This prevents the loading spinner from showing for every API call
                state.error = null;
            })
            .addCase(fetchAdminRevenue.fulfilled, (state, action) => {
                // Don't set global loading state to false here
                const { timeUnit, data } = action.payload;
                
                // Update the appropriate state based on time unit
                switch(timeUnit) {
                    case 'daily':
                        state.dailyRevenue = data;
                        break;
                    case 'weekly':
                        state.weeklyRevenue = data;
                        break;
                    case 'monthly':
                        state.monthlyRevenue = data;
                        break;
                    case 'yearly':
                        state.yearlyRevenue = data;
                        break;
                    default:
                        break;
                }
            })
            .addCase(fetchAdminRevenue.rejected, (state, action) => {
                // Don't set global loading state to false here
                state.error = action.payload?.message || 'Failed to fetch revenue data';
            })
            
            // Fetch all revenue data in one call
            .addCase(fetchAllAdminRevenue.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllAdminRevenue.fulfilled, (state, action) => {
                state.isLoading = false;
                
                // Update all revenue data at once
                if (action.payload && action.payload.success) {
                    // The server now returns all data in a single response
                    state.dailyRevenue = action.payload.dailyRevenue || [];
                    state.weeklyRevenue = action.payload.weeklyRevenue || [];
                    state.monthlyRevenue = action.payload.monthlyRevenue || [];
                    state.yearlyRevenue = action.payload.yearlyRevenue || [];
                    
                    console.log('Successfully updated all revenue data');
                } else {
                    console.error('Invalid response format from revenue API:', action.payload);
                }
            })
            .addCase(fetchAllAdminRevenue.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Failed to fetch all revenue data';
                console.error('Failed to fetch revenue data:', action.payload);
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
                
                // Update the pendingDeliveries count based on the current orders
                if (state.revenueStats) {
                    // Count pending deliveries (confirmed, processing, shipped but not delivered)
                    const pendingDeliveries = state.adminOrders.filter(order => {
                        // Normalize status to lowercase for consistent comparison
                        const orderStatus = order.orderStatus ? order.orderStatus.toLowerCase() : '';
                        const paymentStatus = order.paymentStatus ? order.paymentStatus.toLowerCase() : '';
                        
                        // Only include confirmed, processing, and shipped orders that are paid
                        return ['confirmed', 'processing', 'shipped'].includes(orderStatus) && 
                               paymentStatus === 'paid';
                    }).length;
                    
                    // Update the revenueStats with the new pendingDeliveries count
                    state.revenueStats = {
                        ...state.revenueStats,
                        pendingDeliveries
                    };
                }
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload?.message || 'Failed to update order status';
            });
    }
});

export const { resetRevenueState, resetLoadingState } = adminRevenueSlice.actions;
export default adminRevenueSlice.reducer;
