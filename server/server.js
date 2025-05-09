require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db.js');
const authRoutes = require('./routes/auth/authRoutes.js');
const adminProductsRouter = require('./routes/admin/productsRoutes.js');
const shopProductsRouter = require('./routes/shop-view/productRoutes.js');
const shopCartRouter = require('./routes/shop-view/cartRoutes.js');
const shopAddressRouter = require('./routes/shop-view/addressRout.js');
const shopOrderRouter = require('./routes/shop-view/orderRoutes.js');
const adminOrderRouter = require('./routes/admin/orderRoutes.js');
const adminRevenueRouter = require('./routes/admin/revenueRoutes.js');
const shopSearchRouter = require('./routes/shop-view/searchRoutes.js');
const shopReviewRouter = require('./routes/shop-view/reviewRoutes.js');
const commonFeatureRouter = require('./routes/common/featureRoutes.js');
const wishlistRouter = require('./routes/wishlistRoutes.js');
const shopFeaturedCollectionRouter = require('./routes/shop/featuredCollectionRoutes.js');

// Payment routes
const paystackRouter = require('./routes/payment/paystackRoutes.js');

// SuperAdmin routes
const superAdminUserRouter = require('./routes/superAdmin/userRoutes.js');
const superAdminOrdersRouter = require('./routes/superAdmin/ordersRoutes.js');
const superAdminProductsRouter = require('./routes/superAdmin/productsRoutes.js');
const superAdminFeaturedRouter = require('./routes/superAdmin/featuredRoutes.js');
const superAdminFeaturedCollectionRouter = require('./routes/superAdmin/featuredCollectionRoutes.js');



const app = express()
const PORT = process.env.PORT || 5000;
connectDB();

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Cache-Control",
            "Expires",
            "Pragma"
        ],
        credentials : true
    })
);




app.use(cookieParser());
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/shop/products', shopProductsRouter);
app.use('/api/shop/cart', shopCartRouter);
app.use('/api/shop/address', shopAddressRouter);
app.use('/api/shop/order', shopOrderRouter);
app.use('/api/admin/orders', adminOrderRouter);
app.use('/api/admin/revenue', adminRevenueRouter);
app.use('/api/shop/search', shopSearchRouter);
app.use('/api/shop/review', shopReviewRouter);
app.use('/api/common/feature', commonFeatureRouter);
app.use('/api/shop/wishlist', wishlistRouter);
app.use('/api/shop/featured-collections', shopFeaturedCollectionRouter);

// Payment routes
app.use('/api/payment/paystack', paystackRouter);

// SuperAdmin routes
app.use('/api/superAdmin/users', superAdminUserRouter);
app.use('/api/superAdmin/orders', superAdminOrdersRouter);
app.use('/api/superAdmin/products', superAdminProductsRouter);
app.use('/api/superAdmin/featured', superAdminFeaturedRouter);
app.use('/api/superAdmin/featured-collections', superAdminFeaturedCollectionRouter);




app.listen(PORT, () =>
console.log(`Server is running on port ${PORT}`)
);




