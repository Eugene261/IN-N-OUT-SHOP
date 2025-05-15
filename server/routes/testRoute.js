const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Products');
const Order = require('../models/Order');

// Test route
router.get('/', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// Generate test data for the system
router.get('/generate-test-data', async (req, res) => {
  try {
    // 1. Create a vendor (admin) if not exists
    let vendor = await User.findOne({ role: 'admin' });
    
    if (!vendor) {
      vendor = new User({
        userName: 'testvendor',
        email: 'vendor@test.com',
        password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1TD7WS', // 'password123'
        role: 'admin'
      });
      await vendor.save();
    }
    
    // 2. Create a test product if not exists
    let product = await Product.findOne({ title: 'Test Product' });
    
    if (!product) {
      product = new Product({
        title: 'Test Product',
        description: 'This is a test product',
        price: 100,
        discountPercentage: 0,
        rating: 4.5,
        stock: 100,
        brand: 'Test Brand',
        category: 'Test Category',
        thumbnail: 'https://via.placeholder.com/150',
        images: ['https://via.placeholder.com/150'],
        createdBy: vendor._id
      });
      await product.save();
    }
    
    // 3. Create a test customer if not exists
    let customer = await User.findOne({ email: 'customer@test.com' });
    
    if (!customer) {
      customer = new User({
        userName: 'testcustomer',
        email: 'customer@test.com',
        password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1TD7WS', // 'password123'
        role: 'user'
      });
      await customer.save();
    }
    
    // 4. Create a test order
    const itemPrice = 100;
    const itemQuantity = 1;
    const itemTotal = itemPrice * itemQuantity;
    
    const orderItem = {
      product: product._id,
      quantity: itemQuantity,
      price: itemPrice,
      status: 'processing',
      vendor: vendor._id,
      productId: product._id.toString(),
      title: product.title,
      image: product.thumbnail
    };
    
    const order = new Order({
      user: customer._id,
      userId: customer._id.toString(),
      items: [orderItem],
      cartItems: [{
        productId: product._id.toString(),
        title: product.title,
        image: product.thumbnail,
        price: itemPrice.toString(),
        quantity: itemQuantity,
        status: 'processing'
      }],
      addressInfo: {
        region: 'Test Region',
        address: '123 Test Street',
        city: 'Test City',
        phone: '1234567890',
        notes: 'Test order'
      },
      status: 'processing',
      orderStatus: 'processing',
      paymentMethod: 'paystack',
      paymentStatus: 'completed',
      totalAmount: itemTotal,
      orderDate: new Date(),
      orderUpdateDate: new Date()
    });
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Test data generated successfully',
      data: {
        vendor: vendor._id,
        product: product._id,
        customer: customer._id,
        order: order._id
      }
    });
  } catch (error) {
    console.error('Error generating test data:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating test data',
      error: error.message
    });
  }
});

module.exports = router;
