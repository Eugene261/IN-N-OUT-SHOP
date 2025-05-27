const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const emailService = require('./services/emailService');
const User = require('./models/User');

async function testAllNotifications() {
    console.log('🧪 Testing Complete Email Notification System...\n');
    
    const testEmail = process.argv[2];
    if (!testEmail) {
        console.log('❌ Please provide a test email address:');
        console.log('   node test-all-notifications.js your-email@example.com');
        process.exit(1);
    }
    
    console.log(`📧 Testing all notifications with email: ${testEmail}\n`);
    
    const results = {};
    
    try {
        // Test 1: Welcome Email
        console.log('🎉 Test 1: Welcome Email');
        try {
            await emailService.sendWelcomeEmail(testEmail, 'Test User');
            results.welcome = '✅ SUCCESS';
        } catch (error) {
            results.welcome = `❌ FAILED: ${error.message}`;
        }
        
        // Test 2: Password Reset Email
        console.log('🔐 Test 2: Password Reset Email');
        try {
            const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/reset-password/test-token`;
            await emailService.sendPasswordResetEmail(testEmail, resetUrl, 'Test User');
            results.passwordReset = '✅ SUCCESS';
        } catch (error) {
            results.passwordReset = `❌ FAILED: ${error.message}`;
        }
        
        // Test 3: Order Confirmation Email
        console.log('🛍️ Test 3: Order Confirmation Email');
        try {
            await emailService.sendOrderConfirmationEmail(
                testEmail,
                'Test Customer',
                {
                    orderId: 'TEST-12345',
                    orderDate: new Date(),
                    totalAmount: 150.00,
                    paymentMethod: 'Credit Card',
                    estimatedDelivery: '3-5 business days',
                    items: [
                        {
                            title: 'Test Product 1',
                            image: 'https://via.placeholder.com/150',
                            quantity: 2,
                            price: 50.00
                        },
                        {
                            title: 'Test Product 2',
                            image: 'https://via.placeholder.com/150',
                            quantity: 1,
                            price: 50.00
                        }
                    ],
                    shippingAddress: {
                        customerName: 'Test Customer',
                        address: '123 Test Street',
                        city: 'Test City',
                        region: 'Test Region',
                        phone: '+233-24-123-4567'
                    }
                }
            );
            results.orderConfirmation = '✅ SUCCESS';
        } catch (error) {
            results.orderConfirmation = `❌ FAILED: ${error.message}`;
        }
        
        // Test 4: Order Status Update Email
        console.log('📦 Test 4: Order Status Update Email');
        try {
            await emailService.sendOrderStatusUpdateEmail(
                testEmail,
                'Test Customer',
                {
                    orderId: 'TEST-12345',
                    orderDate: new Date(),
                    totalAmount: 150.00,
                    trackingNumber: 'TRK-123456789',
                    estimatedDelivery: '2-3 business days'
                },
                'shipped'
            );
            results.orderStatusUpdate = '✅ SUCCESS';
        } catch (error) {
            results.orderStatusUpdate = `❌ FAILED: ${error.message}`;
        }
        
        // Test 5: Product Sold Notification
        console.log('💰 Test 5: Product Sold Notification');
        try {
            await emailService.sendProductSoldNotificationEmail(
                testEmail,
                'Test Vendor',
                {
                    id: 'prod-123',
                    title: 'Amazing Test Product',
                    image: 'https://via.placeholder.com/150',
                    salePrice: 75.00,
                    category: 'Electronics',
                    sku: 'TEST-SKU-001'
                },
                {
                    orderId: 'TEST-12345',
                    customerName: 'Happy Customer',
                    orderDate: new Date(),
                    quantity: 2,
                    status: 'confirmed'
                }
            );
            results.productSold = '✅ SUCCESS';
        } catch (error) {
            results.productSold = `❌ FAILED: ${error.message}`;
        }
        
        // Test 6: Low Stock Alert
        console.log('⚠️ Test 6: Low Stock Alert');
        try {
            await emailService.sendLowStockAlert(
                testEmail,
                'Test Vendor',
                {
                    id: 'prod-456',
                    title: 'Popular Test Product',
                    price: 99.99,
                    totalStock: 3,
                    image: 'https://via.placeholder.com/150'
                }
            );
            results.lowStockAlert = '✅ SUCCESS';
        } catch (error) {
            results.lowStockAlert = `❌ FAILED: ${error.message}`;
        }
        
        // Test 7: Vendor Payment Notification
        console.log('💳 Test 7: Vendor Payment Notification');
        try {
            await emailService.sendVendorPaymentNotificationEmail(
                testEmail,
                'Test Vendor',
                {
                    amount: 500.00,
                    paymentMethod: 'Bank Transfer',
                    transactionId: 'TXN-789456123',
                    paymentDate: new Date(),
                    period: 'Weekly payment - Week 1',
                    description: 'Payment for sales from January 1-7, 2025',
                    currentBalance: 1250.00,
                    totalEarnings: 2500.00
                }
            );
            results.vendorPayment = '✅ SUCCESS';
        } catch (error) {
            results.vendorPayment = `❌ FAILED: ${error.message}`;
        }
        
        // Test 8: Product Added Notification (SuperAdmin)
        console.log('🆕 Test 8: Product Added Notification');
        try {
            await emailService.sendProductAddedNotificationEmail(
                testEmail,
                {
                    userName: 'Test Admin',
                    email: 'admin@test.com',
                    shopName: 'Test Shop',
                    createdAt: new Date()
                },
                {
                    id: 'prod-789',
                    title: 'New Test Product',
                    description: 'This is a comprehensive test product with all the features you need for testing purposes.',
                    price: 199.99,
                    category: 'Electronics',
                    brand: 'TestBrand',
                    totalStock: 50,
                    image: 'https://via.placeholder.com/150'
                }
            );
            results.productAdded = '✅ SUCCESS';
        } catch (error) {
            results.productAdded = `❌ FAILED: ${error.message}`;
        }
        
        // Test 9: Product Review Request
        console.log('⭐ Test 9: Product Review Request');
        try {
            await emailService.sendProductReviewRequestEmail(
                testEmail,
                'Test Customer',
                {
                    orderId: 'TEST-12345',
                    deliveryDate: new Date()
                },
                {
                    id: 'prod-123',
                    title: 'Amazing Test Product',
                    image: 'https://via.placeholder.com/150'
                }
            );
            results.reviewRequest = '✅ SUCCESS';
        } catch (error) {
            results.reviewRequest = `❌ FAILED: ${error.message}`;
        }
        
        // Test 10: Contact Form Email
        console.log('📧 Test 10: Contact Form Email');
        try {
            await emailService.sendContactUsEmail({
                name: 'Test Customer',
                email: testEmail,
                phone: '+233-24-123-4567',
                subject: 'Test Contact Form Submission',
                message: 'This is a test message to verify the contact form email functionality is working correctly.'
            });
            results.contactForm = '✅ SUCCESS';
        } catch (error) {
            results.contactForm = `❌ FAILED: ${error.message}`;
        }
        
        // Test 11: Monthly Report Email
        console.log('📊 Test 11: Monthly Report Email');
        try {
            await emailService.sendMonthlyReportEmail(
                testEmail,
                'Test Vendor',
                {
                    totalSales: 5000.00,
                    totalOrders: 50,
                    earnings: 4000.00,
                    productsSold: 120,
                    growth: 15,
                    avgOrderValue: 100.00,
                    returnRate: 2,
                    satisfaction: 95,
                    topProducts: [
                        {
                            title: 'Best Seller Product',
                            image: 'https://via.placeholder.com/150',
                            unitsSold: 25,
                            revenue: 1250.00,
                            rating: 4.8
                        },
                        {
                            title: 'Popular Item',
                            image: 'https://via.placeholder.com/150',
                            unitsSold: 20,
                            revenue: 1000.00,
                            rating: 4.6
                        }
                    ]
                }
            );
            results.monthlyReport = '✅ SUCCESS';
        } catch (error) {
            results.monthlyReport = `❌ FAILED: ${error.message}`;
        }
        
        // Test 12: Newsletter Subscription
        console.log('📬 Test 12: Newsletter Subscription');
        try {
            await emailService.sendNewsletterSubscriptionEmail(testEmail, 'Test User');
            results.newsletter = '✅ SUCCESS';
        } catch (error) {
            results.newsletter = `❌ FAILED: ${error.message}`;
        }
        
        // Test 13: New Admin Welcome
        console.log('👋 Test 13: New Admin Welcome');
        try {
            await emailService.sendNewAdminWelcomeEmail(
                testEmail,
                'Test Admin',
                'TempPass123!'
            );
            results.adminWelcome = '✅ SUCCESS';
        } catch (error) {
            results.adminWelcome = `❌ FAILED: ${error.message}`;
        }
        
        // Test 14: Abandoned Cart Email
        console.log('🛒 Test 14: Abandoned Cart Email');
        try {
            await emailService.sendAbandonedCartEmail(
                testEmail,
                'Test Customer',
                [
                    {
                        title: 'Abandoned Product 1',
                        image: 'https://via.placeholder.com/150',
                        quantity: 2,
                        price: 50.00
                    },
                    {
                        title: 'Abandoned Product 2',
                        image: 'https://via.placeholder.com/150',
                        quantity: 1,
                        price: 75.00
                    }
                ]
            );
            results.abandonedCart = '✅ SUCCESS';
        } catch (error) {
            results.abandonedCart = `❌ FAILED: ${error.message}`;
        }
        
        // Test 15: Order Delivered Email
        console.log('📦 Test 15: Order Delivered Email');
        try {
            await emailService.sendOrderDeliveredEmail(
                testEmail,
                'Test Customer',
                {
                    orderId: 'TEST-12345',
                    deliveryDate: new Date(),
                    deliveryTime: '2:30 PM',
                    totalAmount: 150.00
                }
            );
            results.orderDelivered = '✅ SUCCESS';
        } catch (error) {
            results.orderDelivered = `❌ FAILED: ${error.message}`;
        }
        
    } catch (error) {
        console.error('\n❌ General error during testing:', error);
    }
    
    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 EMAIL NOTIFICATION TEST RESULTS');
    console.log('='.repeat(60));
    
    let successCount = 0;
    let totalTests = 0;
    
    Object.entries(results).forEach(([testName, result]) => {
        console.log(`${testName.padEnd(20)} | ${result}`);
        totalTests++;
        if (result.includes('SUCCESS')) successCount++;
    });
    
    console.log('='.repeat(60));
    console.log(`📈 Success Rate: ${successCount}/${totalTests} (${Math.round((successCount/totalTests)*100)}%)`);
    
    if (successCount === totalTests) {
        console.log('🎉 All email notifications are working perfectly!');
        console.log(`📧 Check your inbox at ${testEmail} for all test emails.`);
    } else {
        console.log('⚠️ Some email notifications failed. Check the errors above.');
    }
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Check your email inbox for all test notifications');
    console.log('   2. Verify email templates look good on mobile and desktop');
    console.log('   3. Test email delivery in production environment');
    console.log('   4. Set up email monitoring and analytics');
    
    process.exit(0);
}

// Run the test
testAllNotifications().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
}); 