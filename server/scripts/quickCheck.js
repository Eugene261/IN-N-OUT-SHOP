require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.js');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('🔍 PROFILE DATA CHECK');
  console.log('====================');
  
  const user = await User.findOne({ email: 'eugene@example.com' });
  
  if (user) {
    console.log('✅ Profile EXISTS in database!');
    console.log('📊 Data Summary:');
    console.log('- First Name:', user.firstName || '❌ MISSING');
    console.log('- Last Name:', user.lastName || '❌ MISSING');
    console.log('- Shop Name:', user.shopName || '❌ MISSING');
    console.log('- Base Region:', user.baseRegion || '❌ MISSING');
    console.log('- Base City:', user.baseCity || '❌ MISSING');
    console.log('- Phone:', user.phone || '❌ MISSING');
    console.log('- Email:', user.email);
    
    console.log('\n🛠️ SOLUTION:');
    console.log('Your data exists but frontend is not loading it.');
    console.log('Try these steps:');
    console.log('1. Refresh your profile page');
    console.log('2. Check browser console for errors');
    console.log('3. Clear browser cache/localStorage');
  } else {
    console.log('❌ Profile NOT found in database');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
}); 