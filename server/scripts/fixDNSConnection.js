require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const { promisify } = require('util');

const resolveSrv = promisify(dns.resolveSrv);
const lookup = promisify(dns.lookup);

async function testDNSAndConnection() {
    console.log('🔍 DNS & MongoDB Connection Fix Script');
    console.log('=====================================');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        return;
    }
    
    // Extract hostname from MongoDB URI
    const match = mongoUri.match(/mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@([^\/]+)/);
    if (!match) {
        console.error('❌ Could not extract hostname from MongoDB URI');
        return;
    }
    
    const hostname = match[1];
    console.log('🔍 Testing DNS resolution for:', hostname);
    
    // Test 1: Basic DNS lookup
    console.log('\n1. Testing basic DNS lookup...');
    try {
        const result = await lookup(hostname);
        console.log('   ✅ Basic DNS lookup successful:', result);
    } catch (error) {
        console.log('   ❌ Basic DNS lookup failed:', error.message);
    }
    
    // Test 2: SRV record lookup (for MongoDB Atlas)
    console.log('\n2. Testing SRV record lookup...');
    try {
        const srvName = `_mongodb._tcp.${hostname}`;
        const srvRecords = await resolveSrv(srvName);
        console.log('   ✅ SRV records found:', srvRecords.length);
        srvRecords.forEach((record, index) => {
            console.log(`   Record ${index + 1}:`, record);
        });
    } catch (error) {
        console.log('   ❌ SRV record lookup failed:', error.message);
    }
    
    // Test 3: Try different DNS servers
    console.log('\n3. Testing with different DNS servers...');
    
    const dnsServers = [
        { name: 'Google DNS', servers: ['8.8.8.8', '8.8.4.4'] },
        { name: 'Cloudflare DNS', servers: ['1.1.1.1', '1.0.0.1'] },
        { name: 'OpenDNS', servers: ['208.67.222.222', '208.67.220.220'] }
    ];
    
    for (const dnsConfig of dnsServers) {
        console.log(`\n   Testing with ${dnsConfig.name}...`);
        
        // Set DNS servers
        dns.setServers(dnsConfig.servers);
        
        try {
            const result = await lookup(hostname);
            console.log(`   ✅ ${dnsConfig.name} lookup successful:`, result);
            
            // Try MongoDB connection with this DNS
            console.log(`   Testing MongoDB connection with ${dnsConfig.name}...`);
            
            const conn = await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                socketTimeoutMS: 15000,
                family: 4,
                bufferCommands: false,
                bufferMaxEntries: 0
            });
            
            console.log(`   ✅ MongoDB connection successful with ${dnsConfig.name}!`);
            console.log(`   Database: ${conn.connection.name}`);
            console.log(`   Host: ${conn.connection.host}`);
            
            // Close connection
            await mongoose.connection.close();
            console.log(`   Connection closed`);
            
            // If we get here, this DNS server works
            console.log(`\n🎉 SUCCESS! ${dnsConfig.name} resolves MongoDB Atlas correctly`);
            console.log(`💡 SOLUTION: Update your DNS settings to use ${dnsConfig.name}:`);
            console.log(`   Primary DNS: ${dnsConfig.servers[0]}`);
            console.log(`   Secondary DNS: ${dnsConfig.servers[1]}`);
            break;
            
        } catch (error) {
            console.log(`   ❌ ${dnsConfig.name} failed:`, error.message);
        }
    }
    
    // Test 4: Alternative connection strings
    console.log('\n4. Testing alternative connection methods...');
    
    // Create a standard connection string (non-SRV)
    if (mongoUri.includes('+srv')) {
        console.log('   Trying standard connection string (non-SRV)...');
        
        // You would need to replace this with actual MongoDB node addresses
        // This is just an example of what the user might need to do
        console.log('   💡 Consider using standard connection string format:');
        console.log('   mongodb://username:password@host1:27017,host2:27017,host3:27017/database');
        console.log('   Contact your MongoDB Atlas admin for the exact node addresses');
    }
    
    console.log('\n🔧 Additional troubleshooting steps:');
    console.log('   1. Check MongoDB Atlas network access settings');
    console.log('   2. Verify your IP address is whitelisted (0.0.0.0/0 for all IPs)');
    console.log('   3. Check if your ISP or company firewall blocks MongoDB ports');
    console.log('   4. Try connecting from a different network (mobile hotspot)');
    console.log('   5. Check MongoDB Atlas cluster status');
    
    process.exit(0);
}

testDNSAndConnection().catch(console.error); 