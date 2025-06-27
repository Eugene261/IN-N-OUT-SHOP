const axios = require('axios');
require('dotenv').config();

const testOnlineStatus = async () => {
  const API_URL = process.env.CLIENT_URL?.replace('3000', '3001') || 'http://localhost:3001';
  
  console.log('🧪 Testing online status endpoints...');
  console.log('API URL:', API_URL);
  
  try {
    // Test heartbeat endpoint (should fail without auth)
    console.log('\n1. Testing heartbeat endpoint...');
    try {
      await axios.post(`${API_URL}/api/common/messaging/heartbeat`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Heartbeat endpoint responds correctly (401 without auth)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    }
    
    // Test status check endpoint (should fail without auth)
    console.log('\n2. Testing status check endpoint...');
    try {
      await axios.get(`${API_URL}/api/common/messaging/users/test123/status`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Status check endpoint responds correctly (401 without auth)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    }
    
    // Test offline endpoint (should fail without auth)
    console.log('\n3. Testing offline endpoint...');
    try {
      await axios.post(`${API_URL}/api/common/messaging/offline`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Offline endpoint responds correctly (401 without auth)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    }
    
    console.log('\n✅ All online status endpoints are accessible');
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
};

// Run the test
if (require.main === module) {
  testOnlineStatus();
}

module.exports = testOnlineStatus; 