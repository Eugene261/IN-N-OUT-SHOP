import axios from "axios"
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const initialState = {
    approvalURL : null,
    isLoading : false,
    orderId : null,
    orderList : [],
    orderDetails : null
}

export const createNewOrder = createAsyncThunk('/order/createNewOrder', async(orderData, { rejectWithValue }) => {
    try {
        const response = await axios.post('http://localhost:5000/api/shop/order/create', orderData, {
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

// PayPal capturePayment function removed

export const getAllOrdersByUserId = createAsyncThunk('/order/getAllOrdersByUser', async(userId, { rejectWithValue }) => {
    if (!userId) {
        console.error('getAllOrdersByUserId called with no userId');
        return rejectWithValue({ message: 'User ID is required' });
    }
    
    try {
        console.log('Fetching orders for user ID:', userId);
        const response = await axios.get(`http://localhost:5000/api/shop/order/list/${userId}`, {
            withCredentials: true
        });
        console.log('Orders API response:', response.data);
        
        // If the API returns success but no orders, ensure we return an empty array
        if (response.data.success && !response.data.orders) {
            return { success: true, data: [] };
        }
        
        return response.data;
    } catch (error) {
        console.error('Get orders error:', error);
        console.error('Error response data:', error.response?.data);
        return rejectWithValue(error.response?.data || { message: 'Server connection failed' });
    }
});

export const getOrdersDetails = createAsyncThunk('/order/getOrdersDetails', async(id, { rejectWithValue }) => {
    try {
        const response = await axios.get(`http://localhost:5000/api/shop/order/details/${id}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Get order details error:', error);
        return rejectWithValue(error.response?.data || { message: 'Server connection failed' });
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

        .addCase(getOrdersDetails.pending, (state) => {
            state.isLoading = true
        })
        .addCase(getOrdersDetails.fulfilled, (state, action) => {
            state.isLoading = false
            state.orderDetails = action.payload.order;
        })
        .addCase(getOrdersDetails.rejected, (state) => {
            state.isLoading = false
            state.orderDetails = null; 
        })
    }
})

export default ShoppingOrderSlice.reducer;