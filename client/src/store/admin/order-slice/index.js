import axios from "axios"
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

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
    orderList: [],
    orderDetails: null,
    updateStatus: {
        isLoading: false,
        success: false,
        error: null
    }
}

export const getAllOrdersForAdmin = createAsyncThunk('/order/getAllOrdersForAdmin', async(_, { rejectWithValue }) => {
    try {
        const response = await axios.get(
            `http://localhost:5000/api/admin/orders/get`,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        return rejectWithValue(error.response?.data || 'Failed to fetch admin orders');
    }
});

export const getOrdersDetailsForAdmin = createAsyncThunk('/order/getOrdersDetails', async(id, { rejectWithValue }) => {
    try {
        const response = await axios.get(
            `http://localhost:5000/api/admin/orders/details/${id}`,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching order details:', error);
        return rejectWithValue(error.response?.data || 'Failed to fetch order details');
    }
});

// New action to update order status
export const updateOrderStatus = createAsyncThunk('/order/updateStatus', async(data, { rejectWithValue, dispatch }) => {
    try {
        const { orderId, status } = data;
        const response = await axios.put(
            `http://localhost:5000/api/admin/orders/update-status/${orderId}`, 
            { status },
            getAuthConfig()
        );
        
        // After successfully updating the order status, refresh the admin orders list
        // to show the updated status in the admin dashboard
        try {
            // Import the admin revenue slice using dynamic import
            import('../revenue-slice')
                .then(module => {
                    const { fetchAdminOrders } = module;
                    if (typeof fetchAdminOrders === 'function') {
                        dispatch(fetchAdminOrders());
                        console.log('Refreshed admin orders after status update');
                    }
                })
                .catch(err => {
                    console.error('Failed to import admin revenue slice:', err);
                });
        } catch (err) {
            console.error('Failed to refresh admin orders:', err);
        }
        
        // Only attempt to refresh SuperAdmin data if the current user is a SuperAdmin
        try {
            // Get the user role from localStorage
            const userData = localStorage.getItem('user');
            let userRole = '';
            
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    userRole = parsedUser.role;
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
            
            // Only proceed if the user is a SuperAdmin
            if (userRole === 'SuperAdmin') {
                // Import the SuperAdmin slice directly using dynamic import
                import('../../super-admin/orders-slice')
                    .then(module => {
                        // Access the exported functions from the module
                        const { fetchAllOrders, fetchOrderStats } = module;
                        
                        // Check if the functions exist before dispatching
                        if (typeof fetchAllOrders === 'function' && typeof fetchOrderStats === 'function') {
                            // Dispatch the actions to refresh SuperAdmin data
                            dispatch(fetchAllOrders());
                            dispatch(fetchOrderStats());
                            console.log('Refreshed SuperAdmin order data after status update');
                        }
                    })
                    .catch(err => {
                        console.error('Failed to import SuperAdmin actions:', err);
                    });
            }
        } catch (err) {
            console.error('Failed to check user role:', err);
        }
        
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to update order status');
    }
});

const adminOrderSlice = createSlice({
    name: 'adminOrderSlice',
    initialState,
    reducers: {
        resetOrderDetails: (state) => {
            state.orderDetails = null;
        },
        resetUpdateStatus: (state) => {
            state.updateStatus = {
                isLoading: false,
                success: false,
                error: null
            };
        }
    },
    extraReducers: (builder) => {
        builder
        /* Fetching All Orders */
        .addCase(getAllOrdersForAdmin.pending, (state) => {
            state.isLoading = true;
        })
        .addCase(getAllOrdersForAdmin.fulfilled, (state, action) => {
            state.isLoading = false;
            state.orderList = action.payload.data;
        })
        .addCase(getAllOrdersForAdmin.rejected, (state) => {
            state.isLoading = false;
            state.orderList = []; 
        })

        /* Fetching Order By Id */
        .addCase(getOrdersDetailsForAdmin.pending, (state) => {
            state.isLoading = true;
        })
        .addCase(getOrdersDetailsForAdmin.fulfilled, (state, action) => {
            state.isLoading = false;
            state.orderDetails = action.payload.data;
        })
        .addCase(getOrdersDetailsForAdmin.rejected, (state) => {
            state.isLoading = false;
            state.orderDetails = null; 
        })

        /* Updating Order Status */
        .addCase(updateOrderStatus.pending, (state) => {
            state.updateStatus.isLoading = true;
            state.updateStatus.success = false;
            state.updateStatus.error = null;
        })
        .addCase(updateOrderStatus.fulfilled, (state, action) => {
            state.updateStatus.isLoading = false;
            state.updateStatus.success = true;
            
            // Update the entire orderDetails with the new data from the server
            if (state.orderDetails && state.orderDetails._id === action.payload.data._id) {
                // Keep the complete updated order data from the server
                state.orderDetails = action.payload.data;
            }
            
            // Update the order in the orderList
            state.orderList = state.orderList.map(order => 
                order._id === action.payload.data._id 
                    ? { 
                        ...order,
                        orderStatus: action.payload.data.orderStatus,
                        status: action.payload.data.status
                      }
                    : order
            );
        })
        .addCase(updateOrderStatus.rejected, (state, action) => {
            state.updateStatus.isLoading = false;
            // Handle both object and string error messages
            if (typeof action.payload === 'object' && action.payload.message) {
                state.updateStatus.error = action.payload.message;
            } else {
                state.updateStatus.error = action.payload || 'Failed to update status';
            }
        })
    }
});

export const { resetOrderDetails, resetUpdateStatus } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;