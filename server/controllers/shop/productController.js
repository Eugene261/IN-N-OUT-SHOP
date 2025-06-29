const Product = require('../../models/Products.js');
const User = require('../../models/User.js');
const { featureFlags } = require('../../utils/featureFlags');

const getFilteredProducts = async(req, res) => {
    try {
        

        const {category = '', subCategory = '', brand = '', price = '', shop = '', sortBy = "price-lowtohigh" } = req.query;

        let filters = {};
        let shouldFilterBySubcategory = false;

        // ========================================
        // PRODUCT APPROVAL INTEGRATION
        // ========================================
        
        // Only show approved products to customers
        if (featureFlags.isProductApprovalEnabled()) {
            filters.approvalStatus = 'approved';
            console.log('Approval system enabled - filtering for approved products only');
        }
        // If approval system is disabled, show all products (backward compatibility)

        if(category.length){
            // Handle both legacy lowercase categories and new proper case categories
            const categoryValues = category.split(',');
            const categoryFilters = [];
            
            categoryValues.forEach(cat => {
                // Add the original category value
                categoryFilters.push(cat);
                
                // Also add the lowercase version for legacy products
                if (cat !== cat.toLowerCase()) {
                    categoryFilters.push(cat.toLowerCase());
                }
                
                // Also add the proper case version for new products
                if (cat !== cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()) {
                    categoryFilters.push(cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
                }
            });
            
            // Remove duplicates
            const uniqueCategoryFilters = [...new Set(categoryFilters)];
            
            filters.category = {$in: uniqueCategoryFilters};
        }
        
        if(subCategory.length){
            // Handle both legacy and new subcategory formats
            const subcategoryValues = subCategory.split(',');
            const subcategoryFilters = [];
            
            // Helper function to generate database-style subcategory names
            const generateDbSubcategoryVariations = (subcat, categoryFilters) => {
                const variations = [];
                
                // Convert subcategory to database format (lowercase, hyphenated)
                const dbFormat = subcat.toLowerCase()
                    .replace(/\s+&\s+/g, '-')  // Replace " & " with "-"
                    .replace(/\s+/g, '-')      // Replace spaces with hyphens
                    .replace(/[^\w-]/g, '');   // Remove special characters except hyphens
                
                // Add variations with category prefixes
                if (categoryFilters && categoryFilters.$in) {
                    categoryFilters.$in.forEach(cat => {
                        const catPrefix = cat.toLowerCase();
                        variations.push(`${catPrefix}-${dbFormat}`);
                    });
                }
                
                // Also add without category prefix
                variations.push(dbFormat);
                
                return variations;
            };
            
            subcategoryValues.forEach(subcat => {
                // Add original subcategory
                subcategoryFilters.push(subcat);
                
                // Add case variations
                subcategoryFilters.push(subcat.toLowerCase());
                subcategoryFilters.push(subcat.charAt(0).toUpperCase() + subcat.slice(1).toLowerCase());
                
                // Generate database-style variations
                const dbVariations = generateDbSubcategoryVariations(subcat, filters.category);
                subcategoryFilters.push(...dbVariations);
                
                // Add common variations for different subcategories
                if (subcat.includes('T-Shirts') || subcat.includes('t-shirts')) {
                    subcategoryFilters.push('t-shirts & tops', 'T-shirts & Tops', 'tshirts', 'T-Shirts', 't-shirts');
                }
                if (subcat.includes('Pants') || subcat.includes('pants')) {
                    subcategoryFilters.push('pants', 'Pants', 'trousers', 'Trousers');
                }
                if (subcat.includes('Shorts') || subcat.includes('shorts')) {
                    subcategoryFilters.push('shorts', 'Shorts');
                }
                if (subcat.includes('Hoodies') || subcat.includes('hoodies')) {
                    subcategoryFilters.push('hoodies', 'Hoodies', 'hoodies & sweatshirts', 'Hoodies & Sweatshirts');
                }
                if (subcat.includes('Jackets') || subcat.includes('jackets')) {
                    subcategoryFilters.push('jackets', 'Jackets', 'jackets & outerwear', 'Jackets & Outerwear');
                }
            });
            
            const uniqueSubcategoryFilters = [...new Set(subcategoryFilters)];
            
            // First, try to find products with both category and subcategory
            const testFilters = { ...filters, subCategory: {$in: uniqueSubcategoryFilters} };
            const testProducts = await Product.find(testFilters).limit(1);
            
            if (testProducts.length > 0) {
                // Products found with subcategory filter, use it
                filters.subCategory = {$in: uniqueSubcategoryFilters};
                shouldFilterBySubcategory = true;
            } else {
                // No products found with subcategory filter, skip it and just use category
                shouldFilterBySubcategory = false;
                // Don't add subcategory filter if no products match
            }
        }
        if(brand.length){
            // Handle both legacy and new brand formats
            const brandValues = brand.split(',');
            const brandFilters = [];
            
            brandValues.forEach(brandName => {
                brandFilters.push(brandName);
                // Add lowercase version for legacy products
                if (brandName !== brandName.toLowerCase()) {
                    brandFilters.push(brandName.toLowerCase());
                }
                // Add proper case version for new products
                if (brandName !== brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase()) {
                    brandFilters.push(brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase());
                }
            });
            
            const uniqueBrandFilters = [...new Set(brandFilters)];
            console.log('Brand filter values:', uniqueBrandFilters);
            filters.brand = {$in: uniqueBrandFilters};
        }
        
        // Handle shop filtering
        if(shop.length){
            const shopNames = shop.split(',');
            const shopAdmins = await User.find({
                shopName: {$in: shopNames},
                role: 'admin',
                isActive: true
            }).select('_id');
            
            if(shopAdmins.length > 0) {
                const adminIds = shopAdmins.map(admin => admin._id);
                filters.createdBy = {$in: adminIds};
            }
        }
        
        // Handle price range filtering
        if(price.length){
            const priceRanges = price.split(',');
            const priceFilters = [];
            
            priceRanges.forEach(range => {
                if (range === '1000+') {
                    // Handle 'Above GHS 1000' case
                    priceFilters.push({ price: { $gte: 1000 } });
                } else {
                    // Handle normal price ranges (e.g., '0-50', '50-100', etc.)
                    const [min, max] = range.split('-').map(Number);
                    priceFilters.push({ 
                        price: { 
                            $gte: min, 
                            $lte: max 
                        } 
                    });
                }
            });
            
            if (priceFilters.length > 0) {
                filters.$or = priceFilters;
            }
        }

        let sort = {};

        switch (sortBy) {
            case 'price-lowtohigh':
                sort.price = 1
                
                break;

            case 'price-hightolow':
                sort.price = -1
                
                break;    
            case 'title-atoz':
                sort.title = 1
                
                break;    
            case 'title-ztoa':
                sort.title = -1
                
                break;    
        
            default:
                sort.price = 1
                break;
        }


        const products = await Product.find(filters)
            .populate('createdBy', 'userName email shopName shopLogo shopCategory shopRating shopReviewCount baseRegion baseCity')
            .sort(sort);

        // Add cache control headers to prevent browser caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });
        
        res.status(200).json({
            success : true,
            data : products,
            timestamp: Date.now() // Add timestamp to force client to recognize new data
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success : false,
            message : 'Ann error occured'
        })
        
    }
};


const getProductDetails = async (req, res) => {
    try {
        const {id} = req.params;
        
        // Validate if the ID is a valid MongoDB ObjectId format
        if (!id || id === 'undefined' || id === 'null' || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }
        
        const product = await Product.findById(id)
            .populate('createdBy', 'userName email shopName shopLogo shopCategory shopRating shopReviewCount baseRegion baseCity shopDescription shopWebsite shopEstablished');


        if(!product) return res.status(404).json({
            success : false,
            message : 'Product not found!'
        })

        // ========================================
        // PRODUCT APPROVAL CHECK
        // ========================================
        
        // Check if product should be visible to customers
        if (featureFlags.isProductApprovalEnabled()) {
            if (product.approvalStatus !== 'approved') {
                return res.status(404).json({
                    success: false,
                    message: "Product not found!"
                });
            }
        }

        // Add cache control headers to prevent browser caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });
        
        res.json({
            success : true,
            data : product,
            timestamp: Date.now() // Add timestamp to force client to recognize new data
        });
    } catch (error) {
        console.log();
        res.status(500).json({
            success : false,
            message : 'Ann error occured'
        })
        
    }
}


// Fixing the fetchBestsellerProducts and fetchNewArrivalProducts functions

const fetchBestsellerProducts = async (req, res) => {
    try {
        // Add console logs for debugging
        console.log('Fetching bestseller products...');
        
        const bestsellerProducts = await Product.find({ isBestseller: true })
            .populate('createdBy', 'userName email shopName shopLogo shopCategory shopRating baseRegion baseCity');
        
        console.log(`Found ${bestsellerProducts.length} bestseller products`);
        console.log('Sample product (if available):', bestsellerProducts[0]);
        
        // Add cache control headers to prevent browser caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });
        
        res.status(200).json({
            success: true,
            data: bestsellerProducts,
            timestamp: Date.now() // Add timestamp to force client to recognize new data
        });
        
    } catch (error) {
        console.error("Error in fetchBestsellerProducts:", error);
        res.status(500).json({
            success: false,
            message: 'An error occurred fetching bestseller products'
        });
    }
};

const fetchNewArrivalProducts = async (req, res) => {
    try {
        // Add console logs for debugging
        console.log('Fetching new arrival products...');
        
        const newArrivalProducts = await Product.find({ isNewArrival: true })
            .populate('createdBy', 'userName email shopName shopLogo shopCategory shopRating baseRegion baseCity');
        
        console.log(`Found ${newArrivalProducts.length} new arrival products`);
        console.log('Sample product (if available):', newArrivalProducts[0]);
        
        // Add cache control headers to prevent browser caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });
        
        res.status(200).json({
            success: true,
            data: newArrivalProducts,
            timestamp: Date.now() // Add timestamp to force client to recognize new data
        });
        
    } catch (error) {
        console.error("Error in fetchNewArrivalProducts:", error);
        res.status(500).json({
            success: false,
            message: 'An error occurred fetching new arrival products'
        });
    }
};

// Get similar products based on category and brand
const getSimilarProducts = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate if the ID is a valid MongoDB ObjectId format
        if (!id || id === 'undefined' || id === 'null' || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }
        
        // Find the current product to get its category and brand
        const currentProduct = await Product.findById(id);
        
        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Find similar products with the same category or brand, excluding the current product
        const similarProducts = await Product.find({
            $and: [
                { _id: { $ne: id } }, // Exclude current product
                { $or: [
                    { category: currentProduct.category },
                    { brand: currentProduct.brand }
                ]}
            ]
        })
        .populate('createdBy', 'userName email shopName shopLogo shopCategory shopRating baseRegion baseCity')
        .limit(8); // Limit to 8 similar products
        
        // Add cache control headers to prevent browser caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });
        
        res.status(200).json({
            success: true,
            data: similarProducts,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error("Error in getSimilarProducts:", error);
        res.status(500).json({
            success: false,
            message: 'An error occurred fetching similar products'
        });
    }
};

// Simplified toggle bestseller function that focuses on just updating the flag
const toggleBestseller = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate if the ID is a valid MongoDB ObjectId format
        if (!id || id === 'undefined' || id === 'null' || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }
        
        console.log('Attempting to toggle bestseller for product ID:', id);
        
        // Use findByIdAndUpdate to update the product in a single operation
        // This avoids potential issues with the save() method
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            [{ $set: { isBestseller: { $not: '$isBestseller' } } }],
            { new: true } // Return the updated document
        );
        
        if (!updatedProduct) {
            console.log('Product not found with ID:', id);
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        console.log('Successfully toggled bestseller status:', updatedProduct.isBestseller);
        
        // Return success response
        return res.status(200).json({
            success: true,
            data: updatedProduct,
            message: `Product ${updatedProduct.isBestseller ? 'added to' : 'removed from'} bestsellers`
        });
        
    } catch (error) {
        console.error('Error in toggleBestseller:', error);
        console.error('Error stack:', error.stack);
        
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating bestseller status',
            error: error.message || 'Unknown error'
        });
    }
};

// Simplified toggle new arrival function that focuses on just updating the flag
const toggleNewArrival = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate if the ID is a valid MongoDB ObjectId format
        if (!id || id === 'undefined' || id === 'null' || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }
        
        console.log('Attempting to toggle new arrival for product ID:', id);
        
        // Use findByIdAndUpdate to update the product in a single operation
        // This avoids potential issues with the save() method
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            [{ $set: { isNewArrival: { $not: '$isNewArrival' } } }],
            { new: true } // Return the updated document
        );
        
        if (!updatedProduct) {
            console.log('Product not found with ID:', id);
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        console.log('Successfully toggled new arrival status:', updatedProduct.isNewArrival);
        
        // Return success response
        return res.status(200).json({
            success: true,
            data: updatedProduct,
            message: `Product ${updatedProduct.isNewArrival ? 'added to' : 'removed from'} new arrivals`
        });
        
    } catch (error) {
        console.error('Error in toggleNewArrival:', error);
        console.error('Error stack:', error.stack);
        
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating new arrival status',
            error: error.message || 'Unknown error'
        });
    }
};




// Get available shops for filtering
const getAvailableShops = async (req, res) => {
    try {
        const shops = await User.find({
            role: 'admin',
            isActive: true,
            shopName: { $ne: '', $exists: true }
        })
        .select('shopName shopLogo shopCategory')
        .sort({ shopName: 1 });

        // Get product count for each shop
        const shopsWithCounts = await Promise.all(
            shops.map(async (shop) => {
                const productCount = await Product.countDocuments({ createdBy: shop._id });
                return {
                    _id: shop._id,
                    shopName: shop.shopName,
                    shopLogo: shop.shopLogo,
                    shopCategory: shop.shopCategory,
                    productCount
                };
            })
        );

        // Filter out shops with no products
        const shopsWithProducts = shopsWithCounts.filter(shop => shop.productCount > 0);

        res.status(200).json({
            success: true,
            data: shopsWithProducts,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error("Error in getAvailableShops:", error);
        res.status(500).json({
            success: false,
            message: 'An error occurred fetching available shops'
        });
    }
};

// Debug endpoint to see available subcategories
const getDebugSubcategories = async (req, res) => {
    try {
        const { category } = req.query;
        
        let filter = {};
        if (category) {
            filter.category = { $regex: new RegExp(category, 'i') };
        }
        
        const products = await Product.find(filter)
            .select('title category subCategory');
        
        // Group by category
        const categoryGroups = {};
        products.forEach(product => {
            if (!categoryGroups[product.category]) {
                categoryGroups[product.category] = new Set();
            }
            if (product.subCategory) {
                categoryGroups[product.category].add(product.subCategory);
            }
        });
        
        // Convert sets to arrays
        const result = {};
        Object.keys(categoryGroups).forEach(cat => {
            result[cat] = Array.from(categoryGroups[cat]);
        });
        
        res.status(200).json({
            success: true,
            data: result,
            totalProducts: products.length
        });
        
    } catch (error) {
        console.error('Error in getDebugSubcategories:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

// Test endpoint to create sample products for testing multiple subcategories
const createTestProducts = async (req, res) => {
    try {
        // Find an admin user to assign as creator
        const adminUser = await User.findOne({ role: 'admin', isActive: true });
        
        if (!adminUser) {
            return res.status(400).json({
                success: false,
                message: 'No admin user found to create test products'
            });
        }

        const testProducts = [
            {
                title: 'Men\'s Casual Pants',
                description: 'Comfortable casual pants for men',
                category: 'Men',
                subCategory: 'men-pants',
                brand: 'TestBrand',
                price: 45,
                salePrice: 40,
                totalStock: 10,
                image: 'https://via.placeholder.com/300x300?text=Pants',
                additionalImages: [],
                createdBy: adminUser._id
            },
            {
                title: 'Men\'s Summer Shorts',
                description: 'Lightweight summer shorts',
                category: 'Men',
                subCategory: 'men-shorts',
                brand: 'TestBrand',
                price: 25,
                salePrice: 20,
                totalStock: 15,
                image: 'https://via.placeholder.com/300x300?text=Shorts',
                additionalImages: [],
                createdBy: adminUser._id
            },
            {
                title: 'Men\'s Hoodie',
                description: 'Warm and comfortable hoodie',
                category: 'Men',
                subCategory: 'men-hoodies-sweatshirts',
                brand: 'TestBrand',
                price: 60,
                salePrice: 55,
                totalStock: 8,
                image: 'https://via.placeholder.com/300x300?text=Hoodie',
                additionalImages: [],
                createdBy: adminUser._id
            }
        ];

        const createdProducts = await Product.insertMany(testProducts);

        res.status(200).json({
            success: true,
            message: `Created ${createdProducts.length} test products`,
            data: createdProducts
        });

    } catch (error) {
        console.error('Error creating test products:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred creating test products'
        });
    }
};

module.exports = {
    getFilteredProducts,
    getProductDetails,
    fetchBestsellerProducts,
    fetchNewArrivalProducts,
    toggleBestseller,
    toggleNewArrival,
    getSimilarProducts,
    getAvailableShops,
    getDebugSubcategories,
    createTestProducts
};