require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

async function checkAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find admin users
    const admins = await User.find({ role: 'admin' }).select('_id userName email');
    console.log(`Found ${admins.length} admin users:`);
    
    for (const admin of admins) {
      console.log(`- ${admin.userName} (${admin._id})`);
      
      // Create a test token for this admin
      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: 'admin' },
        'CLIENT_SECRET_KEY',
        { expiresIn: '1h' }
      );
      
      console.log(`  Token: ${token}`);
      
      // Verify the token
      try {
        const decoded = jwt.verify(token, 'CLIENT_SECRET_KEY');
        console.log(`  Decoded token: ${JSON.stringify(decoded)}`);
      } catch (error) {
        console.error(`  Token verification error: ${error.message}`);
      }
      
      // Check transactions for this admin
      const transactions = await Transaction.find({ vendor: admin._id });
      console.log(`  Transactions: ${transactions.length}`);
      
      if (transactions.length > 0) {
        console.log(`  Sample transaction: ${JSON.stringify(transactions[0])}`);
      }
    }
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Error checking auth:', error);
    mongoose.connection.close();
  }
}

checkAuth();
