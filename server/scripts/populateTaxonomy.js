require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Brand = require('../models/Brand');
const Size = require('../models/Size');
const Color = require('../models/Color');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce-db';
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected successfully!');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Make sure MongoDB is running');
    console.error('2. Check your MONGODB_URI in the .env file');
    console.error('3. Verify your database credentials');
    process.exit(1);
  }
};

// Categories data
const categoriesData = [
  {
    name: 'Men',
    description: 'Men\'s clothing, shoes, and accessories',
    slug: 'men',
    metaTitle: 'Men\'s Fashion & Accessories',
    metaDescription: 'Shop the latest men\'s fashion, shoes, and accessories',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Women',
    description: 'Women\'s clothing, shoes, and accessories',
    slug: 'women',
    metaTitle: 'Women\'s Fashion & Accessories',
    metaDescription: 'Shop the latest women\'s fashion, shoes, and accessories',
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Kids',
    description: 'Children\'s clothing, shoes, and accessories',
    slug: 'kids',
    metaTitle: 'Kids\' Fashion & Accessories',
    metaDescription: 'Shop the latest kids\' fashion, shoes, and accessories',
    sortOrder: 3,
    isActive: true
  },
  {
    name: 'Accessories',
    description: 'Bags, hats, belts, and other accessories',
    slug: 'accessories',
    metaTitle: 'Fashion Accessories',
    metaDescription: 'Shop bags, hats, belts, and other fashion accessories',
    sortOrder: 4,
    isActive: true
  },
  {
    name: 'Footwear',
    description: 'Shoes and sneakers for all occasions',
    slug: 'footwear',
    metaTitle: 'Shoes & Sneakers',
    metaDescription: 'Shop the latest shoes and sneakers for men, women, and kids',
    sortOrder: 5,
    isActive: true
  },
  {
    name: 'Devices',
    description: 'Electronics and gadgets',
    slug: 'devices',
    metaTitle: 'Electronics & Gadgets',
    metaDescription: 'Shop the latest electronics, smartphones, and gadgets',
    sortOrder: 6,
    isActive: true
  }
];

// Subcategories data (will be linked to categories after creation)
const subcategoriesData = [
  // Men's subcategories
  { name: 'T-Shirts & Tops', description: 'Men\'s t-shirts, tank tops, and casual tops', categoryName: 'Men', sortOrder: 1 },
  { name: 'Pants', description: 'Men\'s casual and dress pants', categoryName: 'Men', sortOrder: 2 },
  { name: 'Trousers', description: 'Men\'s formal and business trousers', categoryName: 'Men', sortOrder: 3 },
  { name: 'Shorts', description: 'Men\'s casual and athletic shorts', categoryName: 'Men', sortOrder: 4 },
  { name: 'Hoodies & Sweatshirts', description: 'Men\'s hoodies and sweatshirts', categoryName: 'Men', sortOrder: 5 },
  { name: 'Jackets & Outerwear', description: 'Men\'s jackets, coats, and outerwear', categoryName: 'Men', sortOrder: 6 },
  { name: 'Tracksuits', description: 'Men\'s athletic tracksuits', categoryName: 'Men', sortOrder: 7 },
  
  // Women's subcategories
  { name: 'T-Shirts & Tops', description: 'Women\'s t-shirts, blouses, and casual tops', categoryName: 'Women', sortOrder: 1 },
  { name: 'Pants', description: 'Women\'s casual and dress pants', categoryName: 'Women', sortOrder: 2 },
  { name: 'Trousers', description: 'Women\'s formal and business trousers', categoryName: 'Women', sortOrder: 3 },
  { name: 'Shorts', description: 'Women\'s casual and athletic shorts', categoryName: 'Women', sortOrder: 4 },
  { name: 'Hoodies & Sweatshirts', description: 'Women\'s hoodies and sweatshirts', categoryName: 'Women', sortOrder: 5 },
  { name: 'Jackets & Outerwear', description: 'Women\'s jackets, coats, and outerwear', categoryName: 'Women', sortOrder: 6 },
  { name: 'Tracksuits', description: 'Women\'s athletic tracksuits', categoryName: 'Women', sortOrder: 7 },
  { name: 'Dresses', description: 'Women\'s casual and formal dresses', categoryName: 'Women', sortOrder: 8 },
  { name: 'Skirts', description: 'Women\'s casual and formal skirts', categoryName: 'Women', sortOrder: 9 },

  // Kids subcategories
  { name: 'T-Shirts & Tops', description: 'Kids\' t-shirts and casual tops', categoryName: 'Kids', sortOrder: 1 },
  { name: 'Pants', description: 'Kids\' casual and dress pants', categoryName: 'Kids', sortOrder: 2 },
  { name: 'Shorts', description: 'Kids\' casual and athletic shorts', categoryName: 'Kids', sortOrder: 3 },
  { name: 'Hoodies & Sweatshirts', description: 'Kids\' hoodies and sweatshirts', categoryName: 'Kids', sortOrder: 4 },
  { name: 'Dresses', description: 'Girls\' casual and formal dresses', categoryName: 'Kids', sortOrder: 5 },

  // Footwear subcategories
  { name: 'Running', description: 'Running shoes and athletic footwear', categoryName: 'Footwear', sortOrder: 1 },
  { name: 'Basketball', description: 'Basketball shoes and sneakers', categoryName: 'Footwear', sortOrder: 2 },
  { name: 'Training & Gym', description: 'Training shoes and gym footwear', categoryName: 'Footwear', sortOrder: 3 },
  { name: 'Lifestyle', description: 'Casual lifestyle sneakers', categoryName: 'Footwear', sortOrder: 4 },
  { name: 'Soccer', description: 'Soccer cleats and football boots', categoryName: 'Footwear', sortOrder: 5 },
  { name: 'Casual Shoes', description: 'Casual everyday shoes', categoryName: 'Footwear', sortOrder: 6 },
  { name: 'Formal Shoes', description: 'Dress shoes and formal footwear', categoryName: 'Footwear', sortOrder: 7 },

  // Accessories subcategories
  { name: 'Bags & Backpacks', description: 'Handbags, backpacks, and travel bags', categoryName: 'Accessories', sortOrder: 1 },
  { name: 'Hats & Beanies', description: 'Hats, caps, and beanies', categoryName: 'Accessories', sortOrder: 2 },
  { name: 'Socks & Underwear', description: 'Socks, underwear, and intimate apparel', categoryName: 'Accessories', sortOrder: 3 },
  { name: 'Sports Equipment', description: 'Sports gear and equipment', categoryName: 'Accessories', sortOrder: 4 },
  { name: 'Belts', description: 'Belts and leather accessories', categoryName: 'Accessories', sortOrder: 5 },
  { name: 'Jewelry', description: 'Watches, necklaces, and fashion jewelry', categoryName: 'Accessories', sortOrder: 6 },

  // Devices subcategories
  { name: 'Smartphones', description: 'Mobile phones and smartphones', categoryName: 'Devices', sortOrder: 1 },
  { name: 'Tablets', description: 'Tablets and iPad devices', categoryName: 'Devices', sortOrder: 2 },
  { name: 'Laptops', description: 'Laptops and notebook computers', categoryName: 'Devices', sortOrder: 3 },
  { name: 'Smartwatches', description: 'Smart watches and fitness trackers', categoryName: 'Devices', sortOrder: 4 },
  { name: 'Headphones', description: 'Headphones and earbuds', categoryName: 'Devices', sortOrder: 5 },
  { name: 'Speakers', description: 'Bluetooth speakers and audio systems', categoryName: 'Devices', sortOrder: 6 }
];

// Brands data
const brandsData = [
  // Fashion brands
  { name: 'Nike', description: 'Just Do It', website: 'https://nike.com', sortOrder: 1 },
  { name: 'Adidas', description: 'Impossible is Nothing', website: 'https://adidas.com', sortOrder: 2 },
  { name: 'Puma', description: 'Forever Faster', website: 'https://puma.com', sortOrder: 3 },
  { name: 'Levi\'s', description: 'Quality never goes out of style', website: 'https://levi.com', sortOrder: 4 },
  { name: 'Zara', description: 'Love Your Curves', website: 'https://zara.com', sortOrder: 5 },
  { name: 'H&M', description: 'Fashion and quality at the best price', website: 'https://hm.com', sortOrder: 6 },
  { name: 'Uniqlo', description: 'Made for All', website: 'https://uniqlo.com', sortOrder: 7 },
  { name: 'Under Armour', description: 'I Will', website: 'https://underarmour.com', sortOrder: 8 },
  { name: 'Calvin Klein', description: 'Be Bold. Be Brave. Be Beautiful. Be You.', website: 'https://calvinklein.com', sortOrder: 9 },
  { name: 'Tommy Hilfiger', description: 'Classic American Cool', website: 'https://tommy.com', sortOrder: 10 },
  
  // Tech brands
  { name: 'Apple', description: 'Think Different', website: 'https://apple.com', sortOrder: 11 },
  { name: 'Samsung', description: 'Do What You Can\'t', website: 'https://samsung.com', sortOrder: 12 },
  { name: 'Google', description: 'Don\'t be evil', website: 'https://google.com', sortOrder: 13 },
  { name: 'Sony', description: 'Be Moved', website: 'https://sony.com', sortOrder: 14 },
  { name: 'Microsoft', description: 'Empower every person and organization', website: 'https://microsoft.com', sortOrder: 15 },
  { name: 'Huawei', description: 'Make it Possible', website: 'https://huawei.com', sortOrder: 16 },
  { name: 'OnePlus', description: 'Never Settle', website: 'https://oneplus.com', sortOrder: 17 }
];

// Sizes data
const sizesData = [
  // Clothing sizes
  { name: 'XS', code: 'XS', category: 'clothing', description: 'Extra Small', sortOrder: 1 },
  { name: 'S', code: 'S', category: 'clothing', description: 'Small', sortOrder: 2 },
  { name: 'M', code: 'M', category: 'clothing', description: 'Medium', sortOrder: 3 },
  { name: 'L', code: 'L', category: 'clothing', description: 'Large', sortOrder: 4 },
  { name: 'XL', code: 'XL', category: 'clothing', description: 'Extra Large', sortOrder: 5 },
  { name: 'XXL', code: 'XXL', category: 'clothing', description: '2X Large', sortOrder: 6 },
  { name: '3XL', code: '3XL', category: 'clothing', description: '3X Large', sortOrder: 7 },

  // Trouser waist sizes (using 'clothing' category)
  { name: 'W28', code: 'W28', category: 'clothing', description: 'Waist 28 inches', sortOrder: 8 },
  { name: 'W30', code: 'W30', category: 'clothing', description: 'Waist 30 inches', sortOrder: 9 },
  { name: 'W32', code: 'W32', category: 'clothing', description: 'Waist 32 inches', sortOrder: 10 },
  { name: 'W34', code: 'W34', category: 'clothing', description: 'Waist 34 inches', sortOrder: 11 },
  { name: 'W36', code: 'W36', category: 'clothing', description: 'Waist 36 inches', sortOrder: 12 },
  { name: 'W38', code: 'W38', category: 'clothing', description: 'Waist 38 inches', sortOrder: 13 },
  { name: 'W40', code: 'W40', category: 'clothing', description: 'Waist 40 inches', sortOrder: 14 },
  { name: 'W42', code: 'W42', category: 'clothing', description: 'Waist 42 inches', sortOrder: 15 },

  // EU Footwear sizes
  { name: 'EU 36', code: 'EU36', category: 'footwear', description: 'European size 36', sortOrder: 1 },
  { name: 'EU 37', code: 'EU37', category: 'footwear', description: 'European size 37', sortOrder: 2 },
  { name: 'EU 38', code: 'EU38', category: 'footwear', description: 'European size 38', sortOrder: 3 },
  { name: 'EU 39', code: 'EU39', category: 'footwear', description: 'European size 39', sortOrder: 4 },
  { name: 'EU 40', code: 'EU40', category: 'footwear', description: 'European size 40', sortOrder: 5 },
  { name: 'EU 41', code: 'EU41', category: 'footwear', description: 'European size 41', sortOrder: 6 },
  { name: 'EU 42', code: 'EU42', category: 'footwear', description: 'European size 42', sortOrder: 7 },
  { name: 'EU 43', code: 'EU43', category: 'footwear', description: 'European size 43', sortOrder: 8 },
  { name: 'EU 44', code: 'EU44', category: 'footwear', description: 'European size 44', sortOrder: 9 },
  { name: 'EU 45', code: 'EU45', category: 'footwear', description: 'European size 45', sortOrder: 10 },
  { name: 'EU 46', code: 'EU46', category: 'footwear', description: 'European size 46', sortOrder: 11 },
  { name: 'EU 47', code: 'EU47', category: 'footwear', description: 'European size 47', sortOrder: 12 },

  // Accessories sizes
  { name: 'One Size', code: 'OS', category: 'accessories', description: 'One size fits all', sortOrder: 1 },
  { name: 'Adjustable', code: 'ADJ', category: 'accessories', description: 'Adjustable size', sortOrder: 2 },
  { name: 'Small', code: 'S-ACC', category: 'accessories', description: 'Small accessory size', sortOrder: 3 },
  { name: 'Medium', code: 'M-ACC', category: 'accessories', description: 'Medium accessory size', sortOrder: 4 },
  { name: 'Large', code: 'L-ACC', category: 'accessories', description: 'Large accessory size', sortOrder: 5 }
];

// Colors data
const colorsData = [
  // Basic colors
  { name: 'Black', code: 'BLK', hexCode: '#000000', colorFamily: 'black', description: 'Classic black', sortOrder: 1 },
  { name: 'White', code: 'WHT', hexCode: '#FFFFFF', colorFamily: 'white', description: 'Pure white', sortOrder: 2 },
  { name: 'Gray', code: 'GRY', hexCode: '#808080', colorFamily: 'gray', description: 'Medium gray', sortOrder: 3 },
  { name: 'Silver', code: 'SLV', hexCode: '#C0C0C0', colorFamily: 'gray', description: 'Metallic silver', sortOrder: 4 },
  { name: 'Navy', code: 'NVY', hexCode: '#000080', colorFamily: 'blue', description: 'Navy blue', sortOrder: 5 },
  { name: 'Beige', code: 'BGE', hexCode: '#F5F5DC', colorFamily: 'brown', description: 'Light beige', sortOrder: 6 },

  // Primary colors
  { name: 'Red', code: 'RED', hexCode: '#FF0000', colorFamily: 'red', description: 'Bright red', sortOrder: 10 },
  { name: 'Blue', code: 'BLU', hexCode: '#0000FF', colorFamily: 'blue', description: 'Royal blue', sortOrder: 11 },
  { name: 'Yellow', code: 'YLW', hexCode: '#FFFF00', colorFamily: 'yellow', description: 'Bright yellow', sortOrder: 12 },

  // Secondary colors
  { name: 'Green', code: 'GRN', hexCode: '#008000', colorFamily: 'green', description: 'Forest green', sortOrder: 15 },
  { name: 'Orange', code: 'ORG', hexCode: '#FFA500', colorFamily: 'orange', description: 'Bright orange', sortOrder: 16 },
  { name: 'Purple', code: 'PRP', hexCode: '#800080', colorFamily: 'purple', description: 'Deep purple', sortOrder: 17 },

  // Additional popular colors
  { name: 'Pink', code: 'PNK', hexCode: '#FFC0CB', colorFamily: 'pink', description: 'Soft pink', sortOrder: 20 },
  { name: 'Brown', code: 'BRN', hexCode: '#A52A2A', colorFamily: 'brown', description: 'Dark brown', sortOrder: 21 },
  { name: 'Teal', code: 'TEL', hexCode: '#008080', colorFamily: 'green', description: 'Teal blue-green', sortOrder: 22 },
  { name: 'Maroon', code: 'MAR', hexCode: '#800000', colorFamily: 'red', description: 'Dark maroon', sortOrder: 23 },
  { name: 'Olive', code: 'OLV', hexCode: '#808000', colorFamily: 'green', description: 'Olive green', sortOrder: 24 },
  { name: 'Gold', code: 'GLD', hexCode: '#FFD700', colorFamily: 'yellow', description: 'Metallic gold', sortOrder: 25 },
  { name: 'Coral', code: 'CRL', hexCode: '#FF7F50', colorFamily: 'orange', description: 'Coral pink', sortOrder: 26 },
  { name: 'Turquoise', code: 'TRQ', hexCode: '#40E0D0', colorFamily: 'blue', description: 'Bright turquoise', sortOrder: 27 },
  { name: 'Khaki', code: 'KHK', hexCode: '#F0E68C', colorFamily: 'brown', description: 'Khaki tan', sortOrder: 28 },
  { name: 'Multicolor', code: 'MLC', hexCode: '#555555', colorFamily: 'gray', description: 'Multiple colors', sortOrder: 30 }
];

// Main population function
const populateTaxonomy = async () => {
  try {
    console.log('🚀 Starting taxonomy population...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Color.deleteMany({}),
      Size.deleteMany({}),
      Brand.deleteMany({}),
      Subcategory.deleteMany({}),
      Category.deleteMany({})
    ]);

    // 1. Create Categories
    console.log('📁 Creating categories...');
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // 2. Create Subcategories (link to categories)
    console.log('📂 Creating subcategories...');
    const subcategoriesWithCategoryIds = subcategoriesData.map(subcat => {
      const category = createdCategories.find(cat => cat.name === subcat.categoryName);
      return {
        name: subcat.name,
        description: subcat.description,
        category: category._id,
        slug: subcat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sortOrder: subcat.sortOrder,
        isActive: true
      };
    });
    
    const createdSubcategories = await Subcategory.insertMany(subcategoriesWithCategoryIds);
    console.log(`✅ Created ${createdSubcategories.length} subcategories`);

    // 3. Create Brands
    console.log('🏷️ Creating brands...');
    const brandsWithSlugs = brandsData.map(brand => ({
      ...brand,
      slug: brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isActive: true
    }));
    
    const createdBrands = await Brand.insertMany(brandsWithSlugs);
    console.log(`✅ Created ${createdBrands.length} brands`);

    // 4. Create Sizes
    console.log('📏 Creating sizes...');
    const sizesWithSlugs = sizesData.map(size => ({
      ...size,
      slug: size.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isActive: true
    }));
    
    const createdSizes = await Size.insertMany(sizesWithSlugs);
    console.log(`✅ Created ${createdSizes.length} sizes`);

    // 5. Create Colors
    console.log('🎨 Creating colors...');
    const colorsWithSlugs = colorsData.map(color => ({
      ...color,
      slug: color.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isActive: true
    }));
    
    const createdColors = await Color.insertMany(colorsWithSlugs);
    console.log(`✅ Created ${createdColors.length} colors`);

    // Summary
    console.log('\n🎉 Taxonomy population completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Subcategories: ${createdSubcategories.length}`);
    console.log(`   Brands: ${createdBrands.length}`);
    console.log(`   Sizes: ${createdSizes.length}`);
    console.log(`   Colors: ${createdColors.length}`);
    console.log('\n✨ Your taxonomy system is now ready for use!');

  } catch (error) {
    console.error('❌ Error populating taxonomy:', error);
    throw error;
  }
};

// Run the script
const runScript = async () => {
  try {
    await connectDB();
    await populateTaxonomy();
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
};

// Export for use as module or run directly
if (require.main === module) {
  runScript();
}

module.exports = { populateTaxonomy, connectDB }; 