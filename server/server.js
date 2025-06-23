require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');

// Environment variable validation
console.log('=== ENVIRONMENT VALIDATION ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET configured:', !!process.env.JWT_SECRET);
console.log('MONGODB_URI configured:', !!process.env.MONGODB_URI);
console.log('CLIENT_URL:', process.env.CLIENT_URL);

if (!process.env.JWT_SECRET) {
  console.error('🚨 CRITICAL: JWT_SECRET environment variable is not set!');
  console.error('This will cause authentication failures. Please set JWT_SECRET in your environment variables.');
}

if (!process.env.MONGODB_URI) {
  console.error('🚨 CRITICAL: MONGODB_URI environment variable is not set!');
  console.error('Database connection will fail. Please set MONGODB_URI in your environment variables.');
}

console.log('=== END ENVIRONMENT VALIDATION ===');

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
const contactRouter = require('./routes/common/contactRoutes.js');
const wishlistRouter = require('./routes/wishlistRoutes.js');
const shopFeaturedCollectionRouter = require('./routes/shop/featuredCollectionRoutes.js');

// Stats and testimonials routes
const statsRouter = require('./routes/shop/stats-routes.js');
const testimonialsRouter = require('./routes/shop/testimonials-routes.js');

// Payment routes
const paystackRouter = require('./routes/payment/paystackRoutes.js');

// SuperAdmin routes
const superAdminUserRouter = require('./routes/superAdmin/userRoutes.js');
const superAdminOrdersRouter = require('./routes/superAdmin/ordersRoutes.js');
const superAdminProductsRouter = require('./routes/superAdmin/productsRoutes.js');
const superAdminFeaturedRouter = require('./routes/superAdmin/featuredRoutes.js');
const superAdminFeaturedCollectionRouter = require('./routes/superAdmin/featuredCollectionRoutes.js');
const superAdminRevenueRouter = require('./routes/superAdmin/revenueRoutes.js');
const superAdminTaxonomyRouter = require('./routes/superAdmin/taxonomyRoutes.js');

// Shipping routes
const shippingRouter = require('./routes/shop/shippingRoutes.js');

// User routes
const userRouter = require('./routes/userRoutes.js');

// Test route
const testRouter = require('./routes/testRoute.js');

// Admin routes
const adminRoutes = require('./routes/admin/adminRoutes');
const shopRoutes = require('./routes/admin/shopRoutes');

const app = express()
const PORT = process.env.PORT || 5000;
connectDB();

app.use(
    cors({
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            process.env.CLIENT_URL,
            'https://in-n-out-shop-a81n.vercel.app',
            // Production domains
            'https://in-nd-out.com',
            'https://www.in-nd-out.com',
        ].filter(Boolean), // Remove any undefined values
        methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Cache-Control",
            "Expires",
            "Pragma",
            "Cookie"
        ],
        credentials : true
    })
);

app.use(cookieParser());
app.use(express.json());

// Session middleware for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key-for-oauth-sessions',
    resave: false,
    saveUninitialized: true, // Required for OAuth 1.0a
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000, // 1 hour (shorter for better serverless compatibility)
        sameSite: 'lax'
    },
    name: 'oauth.sid' // Custom session name for OAuth
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/common', contactRouter);
app.use('/api/shop/wishlist', wishlistRouter);
app.use('/api/shop/featured-collections', shopFeaturedCollectionRouter);

// Stats and testimonials routes
app.use('/api/shop/stats', statsRouter);
app.use('/api/shop/testimonials', testimonialsRouter);

// Shipping routes
app.use('/api/shop/shipping', shippingRouter);

// Shipping diagnostic routes
const shippingDiagnosticRouter = require('./routes/shop-view/shippingDiagnosticRoutes.js');
app.use('/api/shop/shipping-diagnostic', shippingDiagnosticRouter);

// AdminId diagnostic routes
const adminIdDiagnosticRouter = require('./routes/shop-view/adminIdDiagnosticRoutes.js');
app.use('/api/shop/admin-id-diagnostic', adminIdDiagnosticRouter);

// User routes
app.use('/api/users', userRouter);

// Payment routes
app.use('/api/payment/paystack', paystackRouter);

// SuperAdmin routes
app.use('/api/superAdmin/users', superAdminUserRouter);
app.use('/api/superAdmin/orders', superAdminOrdersRouter);
app.use('/api/superAdmin/products', superAdminProductsRouter);
app.use('/api/superAdmin/featured', superAdminFeaturedRouter);
app.use('/api/superAdmin/featured-collections', superAdminFeaturedCollectionRouter);
app.use('/api/superAdmin/revenue', superAdminRevenueRouter);
app.use('/api/superAdmin/taxonomy', superAdminTaxonomyRouter);
app.use('/api/superAdmin/vendor-payments', require('./routes/superAdmin/vendorPaymentRoutes'));

// Test route
app.use('/api/test', testRouter);

// Health check routes
const healthRouter = require('./routes/health');
app.use('/api', healthRouter);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/shop', shopRoutes);
app.use('/api/admin/vendor-payments', require('./routes/admin/vendorPaymentRoutes'));

app.listen(PORT, () =>
console.log(`Server is running on port ${PORT}`)
);




