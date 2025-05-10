import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth-slice/index.js';
import adminProductSlice from './admin/product-slice/index.js';
import shoppingProductSlice from './shop/product-slice/index.js';
import productSyncMiddleware from '../utils/productSyncMiddleware.js';
import shopCartSlice from './shop/cart-slice/index.js';
import shopAddressSlice from './shop/address-slice/index.js';
import shopOrderSlice from './shop/order-slice/index.js';
import adminOrderSlice from './admin/order-slice/index.js';
import adminRevenueSlice from './admin/revenue-slice/index.js';
import shopSearchSlice from './shop/search-slice/index.js';
import shopReviewSlice from './shop/review-slice/index.js';
import commonFeatureSlice from './common-slice/index.js';
import wishlistSlice from './shop/wishlist-slice/index.js';

// SuperAdmin slices
import superAdminUsersSlice from './super-admin/user-slice/index.js';
import superAdminOrdersSlice from './super-admin/orders-slice/index.js';
import superAdminProductsSlice from './super-admin/products-slice/index.js';
import featuredCollectionSlice from './superAdmin/featured-collection-slice/index.js';
import shopFeaturedCollectionSlice from './shop/featured-collection-slice/index.js';


const store = configureStore({
    reducer: {
        auth : authReducer,
        adminProducts : adminProductSlice,
        shopProducts : shoppingProductSlice,
        shopCart : shopCartSlice,
        shopAddress : shopAddressSlice,
        shopOrder : shopOrderSlice,
        adminOrder : adminOrderSlice,
        adminRevenue : adminRevenueSlice,
        shopSearch : shopSearchSlice,
        shopReview : shopReviewSlice,
        commonFeature: commonFeatureSlice,
        wishlist: wishlistSlice,
        
        // SuperAdmin reducers
        superAdminUsers: superAdminUsersSlice,
        superAdminOrders: superAdminOrdersSlice,
        superAdminProducts: superAdminProductsSlice,
        featuredCollections: featuredCollectionSlice,
        
        // Shop public reducers
        shopFeaturedCollections: shopFeaturedCollectionSlice
    },
    // Add our custom middleware to synchronize product updates
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(productSyncMiddleware)
});


export default store;