import axios from "axios"
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { API_BASE_URL } from "@/config/api"

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

export const getAllOrdersForAdmin = createAsyncThunk('/order/getAllOrdersForAdmin', async () => {
    const response = await axios.get(
        `${API_BASE_URL}/api/admin/orders/get`,
        {
            withCredentials: true, // Important: Include credentials for auth
        }
    );

    return response.data;
});

export const getOrdersDetailsForAdmin = createAsyncThunk('/order/getOrdersDetails', async(id, { rejectWithValue }) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/api/admin/orders/details/${id}`,
            {
                withCredentials: true, // Important: Include credentials for auth
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching order details:', error);
        return rejectWithValue(error.response?.data || 'Failed to fetch order details');
    }
});

// New action to update order status
export const updateOrderStatus = createAsyncThunk('/order/updateStatus', async({ orderId, status }) => {
    const response = await axios.put(
        `${API_BASE_URL}/api/admin/orders/update-status/${orderId}`,
        { status },
        {
            withCredentials: true, // Important: Include credentials for auth
        }
    );

    return response.data;
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