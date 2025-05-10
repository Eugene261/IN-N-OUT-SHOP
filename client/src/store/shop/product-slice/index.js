import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    isLoading: false,
    productList: [],
    productDetails: null,
    bestsellerProducts: [],
    newArrivalProducts: [],
    similarProducts: [],
    bestsellerLoading: false,
    newArrivalLoading: false,
    similarProductsLoading: false
}

export const fetchAllFilteredProducts = createAsyncThunk('/products/fetchAllFilteredProducts',  
    async ({ filterParams, sortParams }) => {
        const query = new URLSearchParams({
            ...filterParams,
            sortBy: sortParams,
            _t: Date.now() // Add timestamp to prevent caching
        })

        console.log('Fetching products with timestamp to prevent caching');
        const response = await axios.get(`http://localhost:5000/api/shop/products/get?${query}`);
        console.log('Fetched products response:', response?.data);
        return response?.data;
    }
);

export const fetchProductDetails = createAsyncThunk('/products/fetchProductDetails',  
    async (id) => {
        console.log('Fetching product details with timestamp to prevent caching');
        const response = await axios.get(`http://localhost:5000/api/shop/products/get/${id}?_t=${Date.now()}`);
        console.log('Fetched product details response:', response?.data);
        return response?.data;
    }
);

// New thunk for fetching bestseller products
export const fetchBestsellerProducts = createAsyncThunk(
    '/products/fetchBestsellerProducts',
    async () => {
        console.log('Fetching bestseller products with timestamp to prevent caching');
        const response = await axios.get(`http://localhost:5000/api/shop/products/bestsellers?_t=${Date.now()}`);
        console.log('Fetched bestseller products response:', response?.data);
        return response?.data;
    }
);

// New thunk for fetching new arrival products
export const fetchNewArrivalProducts = createAsyncThunk(
    '/products/fetchNewArrivalProducts',
    async () => {
        console.log('Fetching new arrival products with timestamp to prevent caching');
        const response = await axios.get(`http://localhost:5000/api/shop/products/new-arrivals?_t=${Date.now()}`);
        console.log('Fetched new arrival products response:', response?.data);
        return response?.data;
    }
);

// Thunk for fetching similar products
export const fetchSimilarProducts = createAsyncThunk(
    '/products/fetchSimilarProducts',
    async (productId) => {
        console.log('Fetching similar products with timestamp to prevent caching');
        const response = await axios.get(`http://localhost:5000/api/shop/products/similar/${productId}?_t=${Date.now()}`);
        console.log('Fetched similar products response:', response?.data);
        return response?.data;
    }
);

// New thunk for toggling bestseller status
export const toggleProductBestseller = createAsyncThunk(
    '/products/toggleBestseller',
    async (id) => {
        const response = await axios.patch(
            `http://localhost:5000/api/shop/products/toggle-bestseller/${id}`,
            {}, 
            { withCredentials: true } 
        );
        return response?.data;
    }
);

// New thunk for toggling new arrival status
export const toggleProductNewArrival = createAsyncThunk(
    '/products/toggleNewArrival',
    async (id) => {
        const response = await axios.patch(
            `http://localhost:5000/api/shop/products/toggle-new-arrival/${id}`,
            {}, 
            { withCredentials: true } 
        );
        return response?.data;
    }
);

// New thunk to force refresh product data from the server
export const forceRefreshProductData = createAsyncThunk(
    '/products/forceRefresh',
    async (productId, { dispatch }) => {
        console.log('Force refreshing shop product data for ID:', productId);
        
        // If we have a specific product ID, refresh that product's details
        if (productId) {
            const response = await axios.get(
                `http://localhost:5000/api/shop/products/get/${productId}?t=${Date.now()}`,
                { withCredentials: true }
            );
            return response?.data;
        } 
        // Otherwise refresh all products
        else {
            // Clear the product details first
            dispatch(refreshProductData());
            
            // Then fetch fresh data with a timestamp to prevent caching
            const response = await axios.get(
                `http://localhost:5000/api/shop/products/get?t=${Date.now()}`,
                { withCredentials: true }
            );
            return response?.data;
        }
    }
);

const shoppingProductSlice = createSlice({
    name: 'shoppingProducts',
    initialState,
    reducers: {
        setProductDetails: (state) => {
            state.productDetails = null
        },
        // Add a direct update action for a product
        updateShopProduct: (state, action) => {
            const updatedProduct = action.payload;
            console.log('Directly updating shop product:', updatedProduct._id);
            
            // Update in product list if it exists
            if (state.productList && state.productList.length > 0) {
                state.productList = state.productList.map(product => 
                    product._id === updatedProduct._id ? updatedProduct : product
                );
            }
            
            // Update in product details if it's the currently viewed product
            if (state.productDetails && state.productDetails._id === updatedProduct._id) {
                state.productDetails = updatedProduct;
            }
            
            // Update in bestseller products if it exists there
            if (state.bestsellerProducts && state.bestsellerProducts.length > 0) {
                state.bestsellerProducts = state.bestsellerProducts.map(product => 
                    product._id === updatedProduct._id ? updatedProduct : product
                );
            }
            
            // Update in new arrival products if it exists there
            if (state.newArrivalProducts && state.newArrivalProducts.length > 0) {
                state.newArrivalProducts = state.newArrivalProducts.map(product => 
                    product._id === updatedProduct._id ? updatedProduct : product
                );
            }
        }
    },
    extraReducers: (builder) => {
        builder 
        // Existing cases for fetch all products
        .addCase(fetchAllFilteredProducts.pending, (state) => {
            state.isLoading = true
        })
        .addCase(fetchAllFilteredProducts.fulfilled, (state, action) => {
            state.isLoading = false
            state.productList = action.payload.data;
        })
        .addCase(fetchAllFilteredProducts.rejected, (state) => {
            state.isLoading = false
            state.productList = []
        })

        // Existing cases for product details
        .addCase(fetchProductDetails.pending, (state) => {
            state.isLoading = true
        })
        .addCase(fetchProductDetails.fulfilled, (state, action) => {
            state.isLoading = false
            state.productDetails = action.payload.data;
        })
        .addCase(fetchProductDetails.rejected, (state) => {
            state.isLoading = false
            state.productDetails = null
        })

        // Cases for bestseller products
        .addCase(fetchBestsellerProducts.pending, (state) => {
            state.bestsellerLoading = true
        })
        .addCase(fetchBestsellerProducts.fulfilled, (state, action) => {
            state.bestsellerLoading = false
            state.bestsellerProducts = action.payload.data;
        })
        .addCase(fetchBestsellerProducts.rejected, (state) => {
            state.bestsellerLoading = false
            state.bestsellerProducts = []
        })
        
        // Cases for force refresh product data
        .addCase(forceRefreshProductData.pending, (state) => {
            state.isLoading = true
        })
        .addCase(forceRefreshProductData.fulfilled, (state, action) => {
            state.isLoading = false
            
            // If we got product details for a specific product
            if (action.payload?.data && !Array.isArray(action.payload.data)) {
                state.productDetails = action.payload.data;
                console.log('Updated shop product details:', action.payload.data._id);
            } 
            // If we got a list of products
            else if (action.payload?.data && Array.isArray(action.payload.data)) {
                state.productList = action.payload.data;
                console.log('Updated shop product list, count:', action.payload.data.length);
            }
        })
        .addCase(forceRefreshProductData.rejected, (state) => {
            state.isLoading = false
            console.error('Failed to force refresh product data');
        })

        // New cases for new arrival products
        .addCase(fetchNewArrivalProducts.pending, (state) => {
            state.newArrivalLoading = true
        })
        .addCase(fetchNewArrivalProducts.fulfilled, (state, action) => {
            state.newArrivalLoading = false
            state.newArrivalProducts = action.payload.data;
        })
        .addCase(fetchNewArrivalProducts.rejected, (state) => {
            state.newArrivalLoading = false
            state.newArrivalProducts = []
        })

        // Handle toggle bestseller status
        .addCase(toggleProductBestseller.fulfilled, (state, action) => {
            // Update product in productList if it exists
            const updatedProduct = action.payload.data;
            const index = state.productList.findIndex(product => product._id === updatedProduct._id);
            if (index !== -1) {
                state.productList[index] = updatedProduct;
            }
            
            // Update product details if it's the current product
            if (state.productDetails && state.productDetails._id === updatedProduct._id) {
                state.productDetails = updatedProduct;
            }
            
            // Update bestseller products list
            if (updatedProduct.isBestseller) {
                // Add to bestsellers if not already there
                if (!state.bestsellerProducts.some(p => p._id === updatedProduct._id)) {
                    state.bestsellerProducts.push(updatedProduct);
                }
            } else {
                // Remove from bestsellers
                state.bestsellerProducts = state.bestsellerProducts.filter(
                    product => product._id !== updatedProduct._id
                );
            }
        })

        // Handle toggle new arrival status
        .addCase(toggleProductNewArrival.fulfilled, (state, action) => {
            // Update product in productList if it exists
            const updatedProduct = action.payload.data;
            const index = state.productList.findIndex(product => product._id === updatedProduct._id);
            if (index !== -1) {
                state.productList[index] = updatedProduct;
            }
            
            // Update product details if it's the current product
            if (state.productDetails && state.productDetails._id === updatedProduct._id) {
                state.productDetails = updatedProduct;
            }
            
            // Update in newArrivalProducts list if needed
            const newArrivalIndex = state.newArrivalProducts.findIndex(product => product._id === updatedProduct._id);
            if (updatedProduct.isNewArrival && newArrivalIndex === -1) {
                // Add to list if it's now a new arrival and wasn't before
                state.newArrivalProducts.push(updatedProduct);
            } else if (!updatedProduct.isNewArrival && newArrivalIndex !== -1) {
                // Remove from list if it's no longer a new arrival
                state.newArrivalProducts.splice(newArrivalIndex, 1);
            }
        })
        
        // Cases for similar products
        .addCase(fetchSimilarProducts.pending, (state) => {
            state.similarProductsLoading = true;
        })
        .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
            state.similarProductsLoading = false;
            state.similarProducts = action.payload.data;
        })
        .addCase(fetchSimilarProducts.rejected, (state) => {
            state.similarProductsLoading = false;
            state.similarProducts = [];
        })
    }
})

export const { setProductDetails, updateShopProduct } = shoppingProductSlice.actions;

export default shoppingProductSlice.reducer;