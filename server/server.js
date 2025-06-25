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

// Video routes
const shopVideoRouter = require('./routes/shop/videoRoutes.js');
const superAdminVideoRouter = require('./routes/superAdmin/videoRoutes.js');

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

// NEW: Product Approval System (Feature-flagged)
const superAdminProductApprovalRouter = require('./routes/superAdmin/productApprovalRoutes.js');

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

// Global error handling for unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production to avoid downtime
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Log the error and exit gracefully
  console.error('Stack:', error.stack);
  process.exit(1);
});

// Initialize database connection
connectDB();

// CORS Configuration
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
            // API domain for debugging
            'https://api.in-nd-out.com'
        ].filter(Boolean), // Remove any undefined values
        methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Cache-Control",
            "Expires",
            "Pragma",
            "Cookie",
            "X-Requested-With",
            "Accept"
        ],
        credentials: true,
        optionsSuccessStatus: 200 // For legacy browser support
    })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit

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

// Request logging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

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
app.use('/api/common/messaging', require('./routes/common/messagingRoutes'));
app.use('/api/shop/wishlist', wishlistRouter);
app.use('/api/shop/featured-collections', shopFeaturedCollectionRouter);

// Video routes
app.use('/api/shop/videos', shopVideoRouter);

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
app.use('/api/superAdmin/videos', superAdminVideoRouter);
app.use('/api/superAdmin/vendor-payments', require('./routes/superAdmin/vendorPaymentRoutes'));

// TESTING: Product approval routes to isolate path-to-regexp error
app.use('/api/superAdmin/product-approval', superAdminProductApprovalRouter);

// Test route
app.use('/api/test', testRouter);

// Health check routes
const healthRouter = require('./routes/health');
app.use('/api/health', healthRouter);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/shop', shopRoutes);
app.use('/api/admin/vendor-payments', require('./routes/admin/vendorPaymentRoutes'));

// Temporary migration route - REMOVE AFTER MIGRATION
const migrationRouter = require('./routes/admin/migrationRoutes');
app.use('/api/admin/migrations', migrationRouter);

// TESTING: Feature flags endpoint only
const { getFeatureFlagsStatus } = require('./utils/featureFlags');
app.get('/api/feature-flags/status', getFeatureFlagsStatus);

// COMMENTED OUT: API 404 handler causes path-to-regexp error with '/api' pattern
// The '/api' pattern conflicts with existing route patterns
// app.use('/api', (req, res, next) => {
//   // Only handle requests that haven't been handled by previous routes
//   if (!res.headersSent) {
//     res.status(404).json({
//       success: false,
//       message: `API endpoint ${req.originalUrl} not found`,
//       timestamp: new Date().toISOString()
//     });
//   } else {
//     next();
//   }
// });

// Global Error Handling Middleware
app.use((error, req, res, next) => {
  console.error('🚨 Global Error Handler:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(error.errors).map(err => err.message),
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      timestamp: new Date().toISOString()
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry found',
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      tokenExpired: true,
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('🔄 Received shutdown signal, starting graceful shutdown...');
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection
    require('mongoose').connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force close server after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Timestamp: ${new Date().toISOString()}`);
});

// Graceful shutdown listeners
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});




