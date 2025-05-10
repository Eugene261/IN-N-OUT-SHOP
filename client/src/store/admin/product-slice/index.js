import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios"

const initialState = {
    isLoading: false,
    productList: [],
    error: null
}

// Helper function to get auth config
const getAuthConfig = () => {
    // The server is using cookies for authentication, so we need to include credentials
    return {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true // This is important for sending cookies with the request
    };
};

export const addNewProduct = createAsyncThunk('/products/addNewProduct', async (formData, { rejectWithValue }) => {
    try {
        const response = await axios.post(
            'http://localhost:5000/api/admin/products/add', 
            formData, 
            getAuthConfig()
        );
        return response?.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to add product');
    }
});

export const fetchAllProducts = createAsyncThunk('/products/fetchAllProducts', async (_, { rejectWithValue }) => {
    try {
        console.log('Fetching admin products with auth config:', getAuthConfig());
        const response = await axios.get(
            'http://localhost:5000/api/admin/products/get',
            getAuthConfig()
        );
        console.log('Admin products API response:', response?.data);
        return response?.data;
    } catch (error) {
        console.error('Error fetching admin products:', error.response?.data || error.message);
        return rejectWithValue(error.response?.data || 'Failed to fetch products');
    }
});

export const EditProduct = createAsyncThunk('/products/editProduct', async ({id, formData}, { rejectWithValue }) => {
    try {
        console.log('Editing product with ID:', id);
        console.log('Form data being sent to server:', formData);
        
        const response = await axios.put(
            `http://localhost:5000/api/admin/products/edit/${id}`, 
            formData, 
            getAuthConfig()
        );
        
        console.log('Server response for product edit:', response?.data);
        return response?.data;
    } catch (error) {
        console.error('Error editing product:', error.response?.data || error.message);
        return rejectWithValue(error.response?.data || 'Failed to edit product');
    }
});

export const DeleteProduct = createAsyncThunk('/products/deleteProduct', async ({id}, { rejectWithValue }) => {
    try {
        const response = await axios.delete(
            `http://localhost:5000/api/admin/products/delete/${id}`,
            getAuthConfig()
        );
        return response?.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to delete product');
    }
});

const AdminProductsSlice = createSlice({
    name: 'adminProducts',
    initialState,
    reducers: {
        // Add a reducer to directly update the product list
        updateProductList: (state, action) => {
            state.productList = action.payload;
            console.log('Product list manually updated:', state.productList.length);
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all products
            .addCase(fetchAllProducts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllProducts.fulfilled, (state, action) => {
                state.isLoading = false;
                console.log('Products received from API:', action.payload);
                if (action.payload && action.payload.data) {
                    state.productList = action.payload.data;
                    console.log('Updated productList in state:', state.productList.length);
                } else {
                    console.error('Invalid payload structure:', action.payload);
                    state.productList = [];
                }
                state.error = null;
            })
            .addCase(fetchAllProducts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Failed to fetch products';
            })
            
            // Add new product
            .addCase(addNewProduct.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addNewProduct.fulfilled, (state, action) => {
                state.isLoading = false;
                // Optionally add the new product to the list
                state.productList.push(action.payload.data);
                state.error = null;
            })
            .addCase(addNewProduct.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Failed to add product';
            })
            
            // Edit product
            .addCase(EditProduct.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(EditProduct.fulfilled, (state, action) => {
                state.isLoading = false;
                // Update the edited product in the list
                if (action.payload && action.payload.data) {
                    const updatedProduct = action.payload.data;
                    const productId = updatedProduct._id;
                    
                    console.log('Updating product in Redux store:', productId);
                    console.log('Updated product data:', updatedProduct);
                    
                    // Create a new array with the updated product
                    const updatedList = state.productList.map(product => {
                        if (product._id === productId) {
                            console.log('Found product to update in store');
                            // Create a completely new object to ensure React detects the change
                            return { ...updatedProduct };
                        }
                        return product;
                    });
                    
                    // Replace the entire product list to ensure the UI updates
                    state.productList = updatedList;
                    
                    console.log('Product updated in Redux store successfully');
                    console.log('New product list length:', state.productList.length);
                    
                    // If product wasn't found in the list, add it
                    if (!state.productList.some(p => p._id === productId)) {
                        console.log('Product not found in list, adding it:', productId);
                        state.productList.push({ ...updatedProduct });
                    }
                    
                    console.log('Updated product list in store');
                } else {
                    console.error('Invalid payload structure for edit product:', action.payload);
                }
                state.error = null;
            })
            .addCase(EditProduct.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Failed to edit product';
            })
            
            // Delete product
            .addCase(DeleteProduct.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(DeleteProduct.fulfilled, (state, action) => {
                state.isLoading = false;
                // Remove the deleted product from the list
                state.productList = state.productList.filter(p => p._id !== action.meta.arg.id);
                state.error = null;
            })
            .addCase(DeleteProduct.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Failed to delete product';
            });
    }
});

// Export the action creator
export const { updateProductList } = AdminProductsSlice.actions;

export default AdminProductsSlice.reducer;