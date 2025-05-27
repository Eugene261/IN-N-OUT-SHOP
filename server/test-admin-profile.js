const axios = require('axios');

// Test the admin profile API endpoint
async function testAdminProfile() {
  try {
    console.log('🧪 Testing Admin Profile API Endpoint...\n');

    // First, let's get all users to find an admin
    const usersResponse = await axios.get('http://localhost:5000/api/superAdmin/users/all', {
      withCredentials: true,
      headers: {
        'Authorization': 'Bearer your-jwt-token-here' // You'll need to replace this with a real token
      }
    });

    console.log('✅ Successfully fetched users');
    
    // Find an admin user
    const adminUser = usersResponse.data.users.find(user => 
      user.role === 'admin' || user.role === 'superAdmin'
    );

    if (!adminUser) {
      console.log('❌ No admin users found to test with');
      return;
    }

    console.log(`📋 Testing with admin: ${adminUser.userName} (${adminUser.email})`);

    // Test the admin profile endpoint
    const profileResponse = await axios.get(
      `http://localhost:5000/api/superAdmin/users/profile/${adminUser._id}`,
      {
        withCredentials: true,
        headers: {
          'Authorization': 'Bearer your-jwt-token-here' // You'll need to replace this with a real token
        }
      }
    );

    console.log('✅ Successfully fetched admin profile');
    console.log('\n📊 Profile Data Structure:');
    console.log('- Personal Info:', Object.keys(profileResponse.data.profile.personalInfo));
    console.log('- Shop Config:', Object.keys(profileResponse.data.profile.shopConfig));
    console.log('- Financial Info:', Object.keys(profileResponse.data.profile.financialInfo));
    console.log('- Products Count:', profileResponse.data.profile.products.length);
    console.log('- Shipping Zones Count:', profileResponse.data.profile.shippingZones.length);
    console.log('- Recent Orders Count:', profileResponse.data.profile.recentOrders.length);
    console.log('- Revenue Analytics Periods:', Object.keys(profileResponse.data.profile.revenueAnalytics));
    console.log('- Statistics:', Object.keys(profileResponse.data.profile.statistics));

    console.log('\n💰 Revenue Analytics (All Time):');
    const allTimeRevenue = profileResponse.data.profile.revenueAnalytics.allTime;
    if (allTimeRevenue) {
      console.log(`- Total Revenue: GHS ${allTimeRevenue.totalRevenue}`);
      console.log(`- Net Revenue: GHS ${allTimeRevenue.netRevenue}`);
      console.log(`- Total Orders: ${allTimeRevenue.totalOrders}`);
      console.log(`- Items Sold: ${allTimeRevenue.totalItemsSold}`);
      console.log(`- Platform Fees: GHS ${allTimeRevenue.totalPlatformFees}`);
      console.log(`- Shipping Fees: GHS ${allTimeRevenue.totalShippingFees}`);
    }

    console.log('\n📈 Account Statistics:');
    const stats = profileResponse.data.profile.statistics;
    console.log(`- Total Products: ${stats.totalProducts}`);
    console.log(`- Active Products: ${stats.activeProducts}`);
    console.log(`- Out of Stock: ${stats.outOfStockProducts}`);
    console.log(`- Account Age: ${stats.accountAge} days`);
    console.log(`- Last Login: ${stats.lastLoginDays !== null ? `${stats.lastLoginDays} days ago` : 'Never'}`);

    console.log('\n🎉 Admin Profile API Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Note: You need to provide a valid JWT token to test this endpoint.');
      console.log('   1. Login as a SuperAdmin user');
      console.log('   2. Get the JWT token from the response');
      console.log('   3. Replace "your-jwt-token-here" in this script with the actual token');
    }
  }
}

// Run the test
testAdminProfile(); 