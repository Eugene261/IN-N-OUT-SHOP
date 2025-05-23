const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kwameadarkwah8:Berryokine123@cluster0.bhw3zdt.mongodb.net/mern-ecommerce');
    
    const Transaction = require('./models/Transaction');
    const User = require('./models/User');
    
    console.log('=== CHECKING USERS ===');
    const users = await User.find({role: {$in: ['admin', 'superAdmin']}}, 'userName email role _id').sort({role: 1});
    users.forEach(user => {
      console.log(`ID: ${user._id}, Name: ${user.userName}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    console.log('\n=== CHECKING TRANSACTIONS ===');
    const transactions = await Transaction.find({transactionType: 'payment'}).populate('vendorId', 'userName email role');
    console.log(`Found ${transactions.length} payment transactions:`);
    transactions.forEach(tx => {
      console.log(`Payment ID: ${tx._id}`);
      console.log(`Amount: ${tx.amount}`);
      console.log(`VendorId: ${tx.vendorId ? tx.vendorId._id : 'NULL'}`);
      console.log(`Vendor Name: ${tx.vendorId ? tx.vendorId.userName : 'NULL'}`);
      console.log(`Status: ${tx.status}`);
      console.log(`Created: ${tx.createdAt}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData(); 