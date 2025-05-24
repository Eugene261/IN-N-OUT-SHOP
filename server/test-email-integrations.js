require('dotenv').config();
const emailService = require('./services/emailService');

async function testAllEmailIntegrations() {
    console.log('🧪 Testing Complete Email Integration System...\n');
    
    const testEmail = 'eugeneopoku74@gmail.com';
    const results = {};
    
    try {
        // Test 1: Order Confirmation Email
        console.log('📋 Test 1: Order Confirmation Email');
        try {
            await emailService.sendOrderConfirmationEmail(
                testEmail,
                'John Doe',
                {
                    orderId: 'TEST-ORD-001',
                    orderDate: new Date(),
                    totalAmount: 129.99,
                    paymentMethod: 'Credit Card',
                    estimatedDelivery: '3-5 business days',
                    items: [
                        {
                            title: 'Premium Wireless Headphones',
                            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                            quantity: 1,
                            price: 99.99
                        },
                        {
                            title: 'USB-C Cable',
                            image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
                            quantity: 2,
                            price: 15.00
                        }
                    ],
                    shippingAddress: {
                        address: '123 Main St',
                        city: 'Accra',
                        region: 'Greater Accra'
                    }
                }
            );
            results.orderConfirmation = '✅ SUCCESS';
        } catch (error) {
            results.orderConfirmation = `❌ FAILED: ${error.message}`;
        }
        
        // Test 2: Order Status Update Email
        console.log('📦 Test 2: Order Status Update Email');
        try {
            await emailService.sendOrderStatusUpdateEmail(
                testEmail,
                'John Doe',
                {
                    orderId: 'TEST-ORD-001',
                    orderDate: new Date(),
                    trackingNumber: 'TRK-123456789',
                    estimatedDelivery: '2-3 business days'
                },
                'shipped'
            );
            results.orderStatusUpdate = '✅ SUCCESS';
        } catch (error) {
            results.orderStatusUpdate = `❌ FAILED: ${error.message}`;
        }
        
        // Test 3: Product Sold Notification (Admin)
        console.log('💰 Test 3: Product Sold Notification');
        try {
            await emailService.sendProductSoldNotificationEmail(
                testEmail,
                'Eugene Opoku',
                {
                    id: 'PROD-001',
                    title: 'Premium Wireless Headphones',
                    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                    salePrice: 99.99,
                    category: 'Electronics',
                    sku: 'HEADPHONE-001'
                },
                {
                    orderId: 'TEST-ORD-001',
                    customerName: 'John Doe',
                    orderDate: new Date(),
                    quantity: 1,
                    status: 'confirmed'
                }
            );
            results.productSoldNotification = '✅ SUCCESS';
        } catch (error) {
            results.productSoldNotification = `❌ FAILED: ${error.message}`;
        }
        
        // Test 4: Low Stock Alert
        console.log('⚠️ Test 4: Low Stock Alert');
        try {
            await emailService.sendLowStockAlert(
                testEmail,
                'Eugene Opoku',
                {
                    id: 'PROD-002',
                    title: 'Limited Edition Smartwatch',
                    price: 299.99,
                    totalStock: 3,
                    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
                }
            );
            results.lowStockAlert = '✅ SUCCESS';
        } catch (error) {
            results.lowStockAlert = `❌ FAILED: ${error.message}`;
        }
        
        // Test 5: SuperAdmin Product Review Request
        console.log('👑 Test 5: SuperAdmin Product Review Request');
        try {
            await emailService.sendProductAddedNotificationEmail(
                testEmail,
                {
                    userName: 'Test Admin',
                    email: 'admin@test.com',
                    shopName: 'Test Electronics Store',
                    createdAt: new Date()
                },
                {
                    id: 'PROD-003',
                    title: 'New Gaming Laptop',
                    description: 'High-performance gaming laptop with RTX 4070 graphics card',
                    price: 1299.99,
                    category: 'Computers',
                    brand: 'TechBrand',
                    totalStock: 50,
                    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'
                }
            );
            results.superAdminNotification = '✅ SUCCESS';
        } catch (error) {
            results.superAdminNotification = `❌ FAILED: ${error.message}`;
        }
        
        // Test 6: Contact Form Email
        console.log('📞 Test 6: Contact Form Email');
        try {
            await emailService.sendContactUsEmail({
                name: 'Jane Smith',
                email: testEmail,
                phone: '+233-24-123-4567',
                subject: 'Product Inquiry - Gaming Setup',
                message: 'Hi, I am interested in setting up a complete gaming station. Could you help me choose the right components? I have a budget of $2000.'
            });
            results.contactForm = '✅ SUCCESS';
        } catch (error) {
            results.contactForm = `❌ FAILED: ${error.message}`;
        }
        
        // Test 7: New Admin Welcome Email
        console.log('👋 Test 7: New Admin Welcome Email');
        try {
            await emailService.sendNewAdminWelcomeEmail(
                testEmail,
                'New Admin User',
                'temp123456'
            );
            results.newAdminWelcome = '✅ SUCCESS';
        } catch (error) {
            results.newAdminWelcome = `❌ FAILED: ${error.message}`;
        }
        
        // Test 8: Abandoned Cart Email
        console.log('🛒 Test 8: Abandoned Cart Email');
        try {
            await emailService.sendAbandonedCartEmail(
                testEmail,
                'John Doe',
                [
                    {
                        title: 'Gaming Mouse',
                        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
                        quantity: 1,
                        price: 59.99
                    },
                    {
                        title: 'Mechanical Keyboard',
                        image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
                        quantity: 1,
                        price: 149.99
                    }
                ]
            );
            results.abandonedCart = '✅ SUCCESS';
        } catch (error) {
            results.abandonedCart = `❌ FAILED: ${error.message}`;
        }
        
        // Test 9: Monthly Report Email
        console.log('📊 Test 9: Monthly Sales Report Email');
        try {
            await emailService.sendMonthlyReportEmail(
                testEmail,
                'Eugene Opoku',
                {
                    totalSales: 15750.00,
                    totalOrders: 125,
                    earnings: 12600.00,
                    productsSold: 250,
                    growth: 23,
                    avgOrderValue: 126.00,
                    returnRate: 2,
                    satisfaction: 96,
                    topProducts: [
                        {
                            title: 'Wireless Headphones',
                            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                            unitsSold: 45,
                            revenue: 4495.50,
                            rating: 4.8
                        },
                        {
                            title: 'Gaming Mouse',
                            image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
                            unitsSold: 32,
                            revenue: 1919.68,
                            rating: 4.7
                        }
                    ]
                }
            );
            results.monthlyReport = '✅ SUCCESS';
        } catch (error) {
            results.monthlyReport = `❌ FAILED: ${error.message}`;
        }
        
        // Wait a moment for emails to be sent
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Print results summary
        console.log('\n' + '='.repeat(60));
        console.log('📧 EMAIL INTEGRATION TEST RESULTS');
        console.log('='.repeat(60));
        
        const categories = {
            '🛍️ ORDER MANAGEMENT': {
                'Order Confirmation': results.orderConfirmation,
                'Order Status Updates': results.orderStatusUpdate
            },
            '💼 ADMIN NOTIFICATIONS': {
                'Product Sold Alerts': results.productSoldNotification,
                'Low Stock Warnings': results.lowStockAlert,
                'Monthly Sales Reports': results.monthlyReport
            },
            '👑 SUPERADMIN FEATURES': {
                'Product Review Requests': results.superAdminNotification,
                'New Admin Welcome': results.newAdminWelcome
            },
            '🎯 CUSTOMER ENGAGEMENT': {
                'Abandoned Cart Reminders': results.abandonedCart,
                'Contact Form Handling': results.contactForm
            }
        };
        
        let totalTests = 0;
        let successfulTests = 0;
        
        Object.entries(categories).forEach(([category, tests]) => {
            console.log(`\n${category}:`);
            Object.entries(tests).forEach(([testName, result]) => {
                console.log(`  ${testName}: ${result}`);
                totalTests++;
                if (result.includes('SUCCESS')) successfulTests++;
            });
        });
        
        console.log('\n' + '='.repeat(60));
        console.log(`📊 SUMMARY: ${successfulTests}/${totalTests} tests passed`);
        
        if (successfulTests === totalTests) {
            console.log('🎉 ALL EMAIL INTEGRATIONS ARE WORKING PERFECTLY!');
            console.log('✅ Your IN-N-OUT Store email system is fully operational');
        } else {
            console.log('⚠️ Some email integrations need attention');
            console.log('Check the failed tests above for details');
        }
        
        console.log('\n📬 Check your Gmail inbox for all the beautiful emails!');
        console.log('📧 All emails sent to:', testEmail);
        
    } catch (error) {
        console.error('\n❌ Email integration test failed:', error);
    }
}

// Run the test
testAllEmailIntegrations().then(() => {
    console.log('\n✨ Email integration test completed!');
    process.exit(0);
}).catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
}); 