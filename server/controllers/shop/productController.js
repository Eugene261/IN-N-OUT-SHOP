

const Product = require('../../models/Products.js');

const getFilteredProducts = async(req, res) => {
    try {
        

        const {category = [], brand = [], price = [], sortBy = "price-lowtohigh" } = req.query;

        let filters = {};

        if(category.length){
           
            filters.category = {$in: category.split(',')}
        }
        if(brand.length){
            filters.brand = {$in: brand.split(',')}
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
            .populate('createdBy', 'userName email')
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
        const product = await Product.findById(id)
            .populate('createdBy', 'userName email');


        if(!product) return res.status(404).json({
            success : false,
            message : 'Product not found!'
        })



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
            .populate('createdBy', 'userName email');
        
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
            .populate('createdBy', 'userName email');
        
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
        .populate('createdBy', 'userName email')
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




module.exports = {
    getFilteredProducts,
    getProductDetails,
    fetchBestsellerProducts,
    fetchNewArrivalProducts,
    toggleBestseller,
    toggleNewArrival,
    getSimilarProducts
};