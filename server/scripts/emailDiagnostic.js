/**
 * Email Diagnostic Script - IN-N-OUT Store
 * 
 * This script tests all email functionalities to ensure notifications are working properly
 * Usage: node scripts/emailDiagnostic.js [test-email@example.com]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const emailService = require('../services/emailService');
const User = require('../models/User');
const Product = require('../models/Products');
const Order = require('../models/Order');

// Test email address
const testEmail = process.argv[2] || 'test@example.com';

console.log(`🧪 Starting Email Diagnostic for IN-N-OUT Store`);
console.log(`📧 Test email address: ${testEmail}`);
console.log(`🔧 Email provider: ${process.env.EMAIL_PROVIDER || 'gmail'}`);
console.log(`👤 Email user: ${process.env.EMAIL_USER}`);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ MongoDB connected');
  runEmailDiagnostic();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const runEmailDiagnostic = async () => {
  console.log('\n🔍 STARTING COMPREHENSIVE EMAIL DIAGNOSTIC\n');
  
  try {
    // Test 1: Email Service Configuration
    console.log('TEST 1: Email Service Configuration');
    console.log('='.repeat(50));
    
    if (!emailService.isConfigured) {
      console.log('❌ Email service is not properly configured');
      return;
    }
    
    try {
      await emailService.verifyConnection();
      console.log('✅ Email service connection verified');
    } catch (error) {
      console.log('❌ Email service connection failed:', error.message);
      return;
    }
    
    // Test 2: Welcome Email
    console.log('\nTEST 2: Welcome Email');
    console.log('='.repeat(50));
    
    try {
      await emailService.sendWelcomeEmail(testEmail, 'Test User');
      console.log('✅ Welcome email sent successfully');
    } catch (error) {
      console.log('❌ Welcome email failed:', error.message);
    }
    
    // Test 3: Order Confirmation Email
    console.log('\nTEST 3: Order Confirmation Email');
    console.log('='.repeat(50));
    
    try {
      const mockOrderDetails = {
        orderId: 'TEST_ORDER_123',
        orderDate: new Date(),
        totalAmount: 150.00,
        paymentMethod: 'paystack',
        estimatedDelivery: '3-5 business days',
        items: [
          {
            title: 'Sample T-Shirt',
            image: '/placeholder-product.jpg',
            quantity: 2,
            price: 45.00
          },
          {
            title: 'Sample Sneakers',
            image: '/placeholder-product.jpg', 
            quantity: 1,
            price: 60.00
          }
        ],
        shippingAddress: {
          customerName: 'Test Customer',
          address: '123 Test Street',
          city: 'Accra',
          region: 'Greater Accra',
          phone: '+233501234567'
        }
      };
      
      await emailService.sendOrderConfirmationEmail(testEmail, 'Test Customer', mockOrderDetails);
      console.log('✅ Order confirmation email sent successfully');
    } catch (error) {
      console.log('❌ Order confirmation email failed:', error.message);
    }
    
    // Test 4: Vendor Product Sold Notification
    console.log('\nTEST 4: Vendor Product Sold Notification');
    console.log('='.repeat(50));
    
    try {
      const mockProductDetails = {
        id: 'TEST_PRODUCT_123',
        title: 'Sample Product',
        image: '/placeholder-product.jpg',
        salePrice: 45.00,
        category: 'clothing',
        sku: 'TST-001'
      };
      
      const mockOrderInfo = {
        orderId: 'TEST_ORDER_123',
        customerName: 'Test Customer',
        orderDate: new Date(),
        quantity: 2,
        status: 'confirmed',
        shippingAddress: {
          city: 'Accra',
          region: 'Greater Accra'
        }
      };
      
      await emailService.sendProductSoldNotificationEmail(
        testEmail, 
        'Test Vendor', 
        mockProductDetails, 
        mockOrderInfo
      );
      console.log('✅ Vendor product sold notification sent successfully');
    } catch (error) {
      console.log('❌ Vendor product sold notification failed:', error.message);
    }
    
    // Test 5: Order Status Update Email
    console.log('\nTEST 5: Order Status Update Email');
    console.log('='.repeat(50));
    
    try {
      const mockOrderDetails = {
        orderId: 'TEST_ORDER_123',
        orderDate: new Date(),
        totalAmount: 150.00,
        trackingNumber: 'TN123456789',
        estimatedDelivery: '1-2 business days',
        items: [
          {
            title: 'Sample T-Shirt',
            quantity: 2,
            price: 45.00
          }
        ],
        shippingAddress: {
          address: '123 Test Street, Accra'
        }
      };
      
      await emailService.sendOrderStatusUpdateEmail(
        testEmail, 
        'Test Customer', 
        mockOrderDetails, 
        'shipped'
      );
      console.log('✅ Order status update email sent successfully');
    } catch (error) {
      console.log('❌ Order status update email failed:', error.message);
    }
    
    // Test 6: Real Database Test - Find Recent Orders
    console.log('\nTEST 6: Real Database Test - Recent Orders');
    console.log('='.repeat(50));
    
    try {
      const recentOrders = await Order.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('user');
      
      console.log(`📊 Found ${recentOrders.length} recent orders in database`);
      
      for (const order of recentOrders) {
        console.log(`📦 Order ${order._id}:`);
        console.log(`   Customer: ${order.user?.userName || order.customerName || 'Unknown'}`);
        console.log(`   Email: ${order.user?.email || 'No email'}`);
        console.log(`   Status: ${order.status || order.orderStatus}`);
        console.log(`   Items: ${order.cartItems?.length || 0}`);
        console.log(`   Total: GHS ${order.totalAmount || 0}`);
      }
    } catch (error) {
      console.log('❌ Database test failed:', error.message);
    }
    
    // Test 7: Vendor Lookup Test
    console.log('\nTEST 7: Vendor Lookup Test');
    console.log('='.repeat(50));
    
    try {
      const admins = await User.find({ role: 'admin' }).limit(3);
      console.log(`📊 Found ${admins.length} admin/vendor users`);
      
      for (const admin of admins) {
        console.log(`👤 Vendor ${admin._id}:`);
        console.log(`   Name: ${admin.userName}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        
        // Check if they have products
        const productCount = await Product.countDocuments({ adminId: admin._id });
        console.log(`   Products: ${productCount}`);
      }
    } catch (error) {
      console.log('❌ Vendor lookup test failed:', error.message);
    }
    
    // Test 8: Product-Admin Relationship Test
    console.log('\nTEST 8: Product-Admin Relationship Test');
    console.log('='.repeat(50));
    
    try {
      const products = await Product.find({})
        .populate('adminId')
        .limit(3);
      
      console.log(`📊 Testing ${products.length} products for admin relationship`);
      
      for (const product of products) {
        console.log(`📱 Product ${product._id}:`);
        console.log(`   Title: ${product.title}`);
        console.log(`   Admin ID: ${product.adminId?._id || 'Missing'}`);
        console.log(`   Admin Email: ${product.adminId?.email || 'Not populated'}`);
        console.log(`   Admin Name: ${product.adminId?.userName || 'Not populated'}`);
        
        if (!product.adminId) {
          console.log(`   ⚠️ WARNING: Product has no adminId - vendor notifications will fail`);
        }
      }
    } catch (error) {
      console.log('❌ Product-admin relationship test failed:', error.message);
    }
    
    // Test 9: Email Template Color Test
    console.log('\nTEST 9: Email Template Color Test');
    console.log('='.repeat(50));
    
    try {
      const blackWhiteTestContent = `
        <div class="highlight-box">
          <h3>🎨 Black & White Theme Test</h3>
          <p>This email should display with:</p>
          <ul>
            <li>Black header background</li>
            <li>White content background</li>
            <li>Black text on white background</li>
            <li>Professional black and white styling</li>
          </ul>
          <div style="text-align: center; margin: 20px 0;">
            <a href="#" class="button-primary">Black Button</a>
            <a href="#" class="button-secondary">White Button</a>
          </div>
        </div>
      `;
      
      const htmlContent = emailService.getModernEmailTemplate({
        title: 'IN-N-OUT Store - Color Theme Test',
        headerColor: '#000000', // Black theme
        content: blackWhiteTestContent
      });
      
      await emailService.sendEmail({
        to: testEmail,
        subject: 'IN-N-OUT Store - Black & White Theme Test',
        html: htmlContent,
        text: 'This is a test of the black and white email theme for IN-N-OUT Store.'
      });
      
      console.log('✅ Black & white theme test email sent successfully');
    } catch (error) {
      console.log('❌ Theme test email failed:', error.message);
    }
    
    // Final Summary
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ Email diagnostic completed');
    console.log(`📧 Test emails sent to: ${testEmail}`);
    console.log('📝 Check your inbox for the following emails:');
    console.log('   1. Welcome email');
    console.log('   2. Order confirmation');
    console.log('   3. Vendor product sold notification');
    console.log('   4. Order status update');
    console.log('   5. Black & white theme test');
    console.log('\n💡 If any emails are missing, check:');
    console.log('   - Spam/junk folder');
    console.log('   - Email service configuration');
    console.log('   - Server logs for errors');
    console.log('   - Database relationships');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    console.log('\n🔚 Email diagnostic completed');
    process.exit(0);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('\n📡 MongoDB connection closed');
    process.exit(0);
  });
}); 