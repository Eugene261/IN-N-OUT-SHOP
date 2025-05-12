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
    try {
        const response = await axios.get(`http://localhost:5000/api/shop/order/list/${userId}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Get orders error:', error);
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
            state.isLoading = false
            state.orderList = action.payload.data;
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
            state.orderDetails = action.payload.data;
        })
        .addCase(getOrdersDetails.rejected, (state) => {
            state.isLoading = false
            state.orderDetails = null; 
        })
    }
})

export default ShoppingOrderSlice.reducer;