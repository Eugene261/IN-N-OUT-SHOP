import {createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    isLoading: false,
    addressList: []
};

export const addNewAddress = createAsyncThunk('/addresses/addNewAddress', 
    async(formData) => {
        const response = await axios.post("http://localhost:5000/api/shop/address/add", formData);
        return response.data;
    }
);

export const fetchAllAddresses = createAsyncThunk('/fetchAddresses/fetchAllAddresses', 
    async(userId) => {
        const response = await axios.get(`http://localhost:5000/api/shop/address/get/${userId}`);
        return response.data;
    }
);

export const editAddress = createAsyncThunk('/editAddresses/editAddress', 
    async({userId, addressId, formData}) => {
        const response = await axios.put(
            `http://localhost:5000/api/shop/address/update/${userId}/${addressId}`, 
            formData
        );
        return response.data;
    }
);

export const deleteAddress = createAsyncThunk('/addresses/deleteAddress', 
    async({userId, addressId}) => {
        const response = await axios.delete(`http://localhost:5000/api/shop/address/delete/${userId}/${addressId}`);
        return response.data;
    }
);

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        /* Add New Address */
        .addCase(addNewAddress.pending, (state) => {
            state.isLoading = true;
        })
        .addCase(addNewAddress.fulfilled, (state, action) => {
            state.isLoading = false;
            // state.addressList = action.payload.data
        })
        .addCase(addNewAddress.rejected, (state) => {
            state.isLoading = false;
            // state.addressList = []
        })

        /* Fetch All Address */
        .addCase(fetchAllAddresses.pending, (state) => {
            state.isLoading = true;
        })
        .addCase(fetchAllAddresses.fulfilled, (state, action) => {
            state.isLoading = false;
            state.addressList = action.payload.data;
        })
        .addCase(fetchAllAddresses.rejected, (state) => {
            state.isLoading = false;
            state.addressList = [];
        })

        /* Edit Address */
        .addCase(editAddress.pending, (state) => {
            state.isLoading = true;
        })
        .addCase(editAddress.fulfilled, (state, action) => {
            state.isLoading = false;
            // Optional: Update the addressList immediately instead of waiting for fetchAllAddresses
            // if (action.payload.success && action.payload.data) {
            //   const updatedAddressIndex = state.addressList.findIndex(
            //     addr => addr._id === action.payload.data._id
            //   );
            //   if (updatedAddressIndex !== -1) {
            //     state.addressList[updatedAddressIndex] = action.payload.data;
            //   }
            // }
        })
        .addCase(editAddress.rejected, (state) => {
            state.isLoading = false;
        })

        /* Delete Address */
        .addCase(deleteAddress.pending, (state) => {
            state.isLoading = true;
        })
        .addCase(deleteAddress.fulfilled, (state, action) => {
            state.isLoading = false;
            // Optional: Update the addressList immediately instead of waiting for fetchAllAddresses
            // if (action.payload.success && action.meta.arg.addressId) {
            //   state.addressList = state.addressList.filter(
            //     addr => addr._id !== action.meta.arg.addressId
            //   );
            // }
        })
        .addCase(deleteAddress.rejected, (state) => {
            state.isLoading = false;
        });
    }
});

export default addressSlice.reducer;