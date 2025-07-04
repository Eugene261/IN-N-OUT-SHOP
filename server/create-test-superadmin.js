// Create Test SuperAdmin User
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createTestSuperAdmin = async () => {
  console.log('🔧 CREATING TEST SUPERADMIN USER');
  console.log('================================');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Check if Kwame exists
    const existingUser = await User.findOne({ email: 'kwamead@gmail.com' });
    
    if (existingUser) {
      console.log('👤 User kwamead@gmail.com exists');
      console.log('Current role:', existingUser.role);
      
      // Update to superAdmin and set a known password
      const newPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await User.updateOne(
        { email: 'kwamead@gmail.com' },
        { 
          role: 'superAdmin',
          password: hashedPassword 
        }
      );
      
      console.log('✅ Updated user:');
      console.log('   Email: kwamead@gmail.com');
      console.log('   Password: admin123');
      console.log('   Role: superAdmin');
      
    } else {
      // Create new superAdmin user
      const password = 'admin123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const superAdmin = new User({
        userName: 'Kwame',
        email: 'kwamead@gmail.com',
        password: hashedPassword,
        role: 'superAdmin'
      });
      
      await superAdmin.save();
      
      console.log('✅ Created new SuperAdmin:');
      console.log('   Email: kwamead@gmail.com');
      console.log('   Password: admin123');
      console.log('   Role: superAdmin');
    }
    
    // Test login with the credentials
    console.log('\n🔍 Testing login...');
    const axios = require('axios');
    
    try {
      const loginResponse = await axios({
        method: 'POST',
        url: 'http://localhost:5000/api/auth/login',
        data: {
          email: 'kwamead@gmail.com',
          password: 'admin123'
        },
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log(`Login test: ${loginResponse.status}`);
      if (loginResponse.data.success) {
        console.log('✅ Login successful!');
        console.log('   Token received:', !!loginResponse.data.token);
        console.log('   User role:', loginResponse.data.user?.role);
        
        // Test SuperAdmin API with the token
        const token = loginResponse.data.token;
        const apiTest = await axios({
          method: 'GET',
          url: 'http://localhost:5000/api/superAdmin/users/all',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          validateStatus: () => true
        });
        
        console.log(`\n🧪 SuperAdmin API test: ${apiTest.status}`);
        if (apiTest.status === 200) {
          console.log('✅ SuperAdmin APIs working!');
          console.log(`   Found ${apiTest.data.users?.length || 0} users`);
        } else {
          console.log('❌ SuperAdmin API failed:', apiTest.data);
        }
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
      
    } catch (error) {
      console.log('❌ Login test error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
    process.exit(0);
  }
};

createTestSuperAdmin(); 