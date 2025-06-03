import axios from "axios"
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Define the API base URL using environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const initialState = {
    approvalURL : null,
    isLoading : false,
    orderId : null,
    orderList : [],
    orderDetails : null
}

export const createNewOrder = createAsyncThunk('/order/createNewOrder', async(orderData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/shop/order/create`, orderData, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Order creation error:', error);
        return rejectWithValue(error.response?.data || { message: 'Server connection failed' });
    }
});

export const capturePayment = createAsyncThunk('/order/capturePayment', async({paymentId, orderId}, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/shop/order/capture`, {
            paymentId,
            orderId
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Payment capture error:', error);
        return rejectWithValue(error.response?.data || { message: 'Payment capture failed' });
    }
});

export const getAllOrdersByUserId = createAsyncThunk('/order/getAllOrdersByUserId', async(userId, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/shop/order/list/${userId}`, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Get orders error:', error);
        return rejectWithValue(error.response?.data || { message: 'Failed to fetch orders' });
    }
});

export const getOrderDetails = createAsyncThunk('/order/getOrderDetails', async(id, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/shop/order/details/${id}`, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Get order details error:', error);
        return rejectWithValue(error.response?.data || { message: 'Failed to fetch order details' });
    }
});

const ShoppingOrderSlice = createSlice({
    name : 'shoppingOrderSlice', 
    initialState,
    reducers : {},
    extraReducers : (builder) => {
        builder
        .addCase(createNewOrder.pending, (state) => {
            state.isLoading = true
        })
        .addCase(createNewOrder.fulfilled, (state, action) => {
            state.isLoading = false
            state.approvalURL =  action.payload.approvalURL
            state.orderId =  action.payload.orderId;
            sessionStorage.setItem('currentOrderId', JSON.stringify(action.payload.orderId));
        })
        .addCase(createNewOrder.rejected, (state) => {
            state.isLoading = false
            state.approvalURL = null
            state.orderId = null; 
        })

        /* Fetching All Orders */

        .addCase(getAllOrdersByUserId.pending, (state) => {
            state.isLoading = true
        })
        .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
            state.isLoading = false;
            // Handle different response formats
            if (action.payload.orders) {
                // Format from the screenshot: {success: true, count: 17, orders: Array(17)}
                state.orderList = action.payload.orders;
                console.log('Setting orderList from orders array:', action.payload.orders.length);
            } else if (action.payload.data) {
                // Original expected format
                state.orderList = action.payload.data;
                console.log('Setting orderList from data field:', action.payload.data.length);
            } else {
                // Fallback to empty array
                state.orderList = [];
                console.log('No orders data found in response, setting empty array');
            }
        })
        .addCase(getAllOrdersByUserId.rejected, (state) => {
            state.isLoading = false
            state.orderList = []; 
        })


        /* Fetching  Order By Id */

        .addCase(getOrderDetails.pending, (state) => {
            state.isLoading = true
        })
        .addCase(getOrderDetails.fulfilled, (state, action) => {
            state.isLoading = false
            state.orderDetails = action.payload.order;
        })
        .addCase(getOrderDetails.rejected, (state) => {
            state.isLoading = false
            state.orderDetails = null; 
        })
    }
})

export default ShoppingOrderSlice.reducer;