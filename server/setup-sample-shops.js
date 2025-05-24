require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Products');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_db_name');
        console.log('✅ MongoDB connected for setup');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

async function setupSampleShops() {
    console.log('🏪 Setting up sample shops for testing...\n');
    
    try {
        await connectDB();
        
        // Find existing admins
        const admins = await User.find({ role: 'admin' });
        console.log(`Found ${admins.length} existing admins`);
        
        if (admins.length === 0) {
            console.log('❌ No admins found. Please create some admins first through the superAdmin interface.');
            return;
        }
        
        // Sample shop data
        const sampleShops = [
            {
                shopName: 'Tech Galaxy Store',
                shopDescription: 'Your one-stop destination for all electronics and gadgets. We specialize in smartphones, laptops, accessories and cutting-edge technology.',
                shopCategory: 'Electronics',
                shopWebsite: 'https://techgalaxy.com',
                baseRegion: 'Greater Accra',
                baseCity: 'Accra',
                shopEstablished: new Date('2020-01-15'),
                shopPolicies: {
                    returnPolicy: '30-day return policy on all electronics',
                    shippingPolicy: 'Free shipping on orders above GHS 500',
                    warrantyPolicy: '1-year manufacturer warranty on all products'
                }
            },
            {
                shopName: 'Fashion Forward Boutique',
                shopDescription: 'Trendy fashion for every occasion. From casual wear to formal attire, we have the latest styles for men and women.',
                shopCategory: 'Fashion',
                shopWebsite: 'https://fashionforward.gh',
                baseRegion: 'Ashanti',
                baseCity: 'Kumasi',
                shopEstablished: new Date('2019-06-10'),
                shopPolicies: {
                    returnPolicy: '14-day return policy on unworn items',
                    shippingPolicy: 'Same-day delivery in Kumasi, next-day nationwide',
                    warrantyPolicy: 'Quality guarantee on all garments'
                }
            },
            {
                shopName: 'Home & Garden Paradise',
                shopDescription: 'Beautiful furniture, home decor, and garden supplies to make your house a home. Quality products at affordable prices.',
                shopCategory: 'Home & Garden',
                shopWebsite: 'https://homegardenparadise.com',
                baseRegion: 'Northern',
                baseCity: 'Tamale',
                shopEstablished: new Date('2021-03-20'),
                shopPolicies: {
                    returnPolicy: '7-day return policy on furniture items',
                    shippingPolicy: 'Free delivery and assembly service available',
                    warrantyPolicy: '6-month warranty on furniture items'
                }
            },
            {
                shopName: 'Sports Central',
                shopDescription: 'Premium sports equipment, fitness gear, and athletic wear. Everything you need for an active lifestyle.',
                shopCategory: 'Sports',
                shopWebsite: 'https://sportscentral.gh',
                baseRegion: 'Western',
                baseCity: 'Takoradi',
                shopEstablished: new Date('2018-11-05'),
                shopPolicies: {
                    returnPolicy: '21-day return policy on sports equipment',
                    shippingPolicy: 'Express shipping available for urgent orders',
                    warrantyPolicy: 'Manufacturer warranty applies'
                }
            },
            {
                shopName: 'Beauty Bliss',
                shopDescription: 'Premium cosmetics, skincare, and beauty products. Authentic brands and expert beauty advice.',
                shopCategory: 'Beauty',
                shopWebsite: 'https://beautybliss.com',
                baseRegion: 'Greater Accra',
                baseCity: 'Tema',
                shopEstablished: new Date('2020-08-12'),
                shopPolicies: {
                    returnPolicy: 'No returns on opened beauty products for hygiene reasons',
                    shippingPolicy: 'Temperature-controlled shipping for sensitive products',
                    warrantyPolicy: 'Satisfaction guarantee on all authentic products'
                }
            }
        ];
        
        // Update admins with shop information
        for (let i = 0; i < Math.min(admins.length, sampleShops.length); i++) {
            const admin = admins[i];
            const shopData = sampleShops[i];
            
            console.log(`Setting up shop "${shopData.shopName}" for admin: ${admin.email}`);
            
            await User.findByIdAndUpdate(admin._id, {
                $set: {
                    ...shopData,
                    shopRating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 - 5.0 rating
                    shopReviewCount: Math.floor(Math.random() * 100) + 10, // 10-110 reviews
                    updatedAt: new Date()
                }
            });
            
            console.log(`✅ Shop "${shopData.shopName}" created successfully`);
        }
        
        // Get updated admins with shop data
        const updatedAdmins = await User.find({ 
            role: 'admin',
            shopName: { $ne: '', $exists: true }
        });
        
        console.log(`\n🎉 Successfully set up ${updatedAdmins.length} shops!`);
        
        // Display shop summary
        console.log('\n📊 Shop Summary:');
        updatedAdmins.forEach((admin, index) => {
            console.log(`   ${index + 1}. ${admin.shopName}`);
            console.log(`      Category: ${admin.shopCategory}`);
            console.log(`      Location: ${admin.baseCity}, ${admin.baseRegion}`);
            console.log(`      Rating: ${admin.shopRating}/5 (${admin.shopReviewCount} reviews)`);
            console.log(`      Admin: ${admin.email}`);
            console.log('');
        });
        
        // Check for products created by these admins
        const productCounts = await Promise.all(
            updatedAdmins.map(async (admin) => {
                const count = await Product.countDocuments({ createdBy: admin._id });
                return { shopName: admin.shopName, count };
            })
        );
        
        console.log('📦 Product Counts per Shop:');
        productCounts.forEach(({ shopName, count }) => {
            console.log(`   ${shopName}: ${count} products`);
        });
        
        if (productCounts.some(p => p.count > 0)) {
            console.log('\n✅ Ready to test shop filtering!');
        } else {
            console.log('\n⚠️ No products found. Add some products to test filtering functionality.');
        }
        
        console.log('\n🔧 Next steps:');
        console.log('   1. Run: node test-shop-system.js');
        console.log('   2. Test the shop filtering in your frontend');
        console.log('   3. Admins can update their shop profiles via the admin panel');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n📱 Database connection closed');
    }
}

// Run the setup
setupSampleShops(); 