const User = require('../../models/User.js');
const Product = require('../../models/Products.js');
const Order = require('../../models/Order.js');
const { ImageUploadUtil } = require('../../helpers/cloudinary.js');

// Get shop profile for current admin
const getShopProfile = async (req, res) => {
    try {
        const adminId = req.user._id || req.user.id;
        
        const admin = await User.findById(adminId).select('-password -resetPasswordToken -resetPasswordExpires');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        // Get shop statistics
        const totalProducts = await Product.countDocuments({ createdBy: adminId });
        const totalOrders = await Order.countDocuments({
            'cartItems.adminId': adminId.toString()
        });
        
        // Calculate total earnings from orders
        const orders = await Order.find({
            'cartItems.adminId': adminId.toString(),
            paymentStatus: 'completed'
        });
        
        let totalEarnings = 0;
        orders.forEach(order => {
            order.cartItems.forEach(item => {
                if (item.adminId === adminId.toString()) {
                    totalEarnings += (item.price * item.quantity) * 0.8; // 80% commission
                }
            });
        });
        
        const shopStats = {
            totalProducts,
            totalOrders,
            totalEarnings: totalEarnings.toFixed(2),
            shopRating: admin.shopRating || 0,
            reviewCount: admin.shopReviewCount || 0
        };
        
        res.status(200).json({
            success: true,
            shop: admin,
            stats: shopStats
        });
        
    } catch (error) {
        console.error('Error fetching shop profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shop profile',
            error: error.message
        });
    }
};

// Update shop profile
const updateShopProfile = async (req, res) => {
    try {
        const adminId = req.user._id || req.user.id;
        const {
            shopName,
            shopDescription,
            shopCategory,
            shopWebsite,
            shopEstablished,
            shopPolicies,
            baseRegion,
            baseCity,
            shippingPreferences
        } = req.body;
        
        // Validate required fields
        if (!shopName || shopName.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Shop name is required'
            });
        }
        
        // Check if shop name is already taken by another admin
        const existingShop = await User.findOne({
            shopName: shopName.trim(),
            _id: { $ne: adminId },
            role: 'admin'
        });
        
        if (existingShop) {
            return res.status(400).json({
                success: false,
                message: 'Shop name is already taken. Please choose a different name.'
            });
        }
        
        // Prepare update data
        const updateData = {
            shopName: shopName.trim(),
            shopDescription: shopDescription?.trim() || '',
            shopCategory: shopCategory || 'Other',
            shopWebsite: shopWebsite?.trim() || '',
            baseRegion: baseRegion?.trim() || '',
            baseCity: baseCity?.trim() || '',
            updatedAt: new Date()
        };
        
        // Update shop established date if provided
        if (shopEstablished) {
            updateData.shopEstablished = new Date(shopEstablished);
        }
        
        // Update shop policies if provided
        if (shopPolicies) {
            updateData.shopPolicies = {
                returnPolicy: shopPolicies.returnPolicy?.trim() || '',
                shippingPolicy: shopPolicies.shippingPolicy?.trim() || '',
                warrantyPolicy: shopPolicies.warrantyPolicy?.trim() || ''
            };
        }
        
        // Update shipping preferences if provided
        if (shippingPreferences) {
            updateData.shippingPreferences = {
                defaultBaseRate: parseFloat(shippingPreferences.defaultBaseRate) || 0,
                enableRegionalRates: Boolean(shippingPreferences.enableRegionalRates)
            };
        }
        
        const updatedAdmin = await User.findByIdAndUpdate(
            adminId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');
        
        if (!updatedAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Shop profile updated successfully',
            shop: updatedAdmin
        });
        
    } catch (error) {
        console.error('Error updating shop profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update shop profile',
            error: error.message
        });
    }
};

// Upload shop logo
const uploadShopLogo = async (req, res) => {
    try {
        const adminId = req.user._id || req.user.id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }
        
        // Create proper base64 string
        const b64 = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        // Upload to Cloudinary
        const result = await ImageUploadUtil(dataURI);
        
        // Update admin's shop logo
        const updatedAdmin = await User.findByIdAndUpdate(
            adminId,
            { 
                shopLogo: result.secure_url,
                updatedAt: new Date()
            },
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');
        
        res.status(200).json({
            success: true,
            message: 'Shop logo uploaded successfully',
            logoUrl: result.secure_url,
            shop: updatedAdmin
        });
        
    } catch (error) {
        console.error('Error uploading shop logo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload shop logo',
            error: error.message
        });
    }
};

// Upload shop banner
const uploadShopBanner = async (req, res) => {
    try {
        const adminId = req.user._id || req.user.id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }
        
        // Create proper base64 string
        const b64 = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        // Upload to Cloudinary
        const result = await ImageUploadUtil(dataURI);
        
        // Update admin's shop banner
        const updatedAdmin = await User.findByIdAndUpdate(
            adminId,
            { 
                shopBanner: result.secure_url,
                updatedAt: new Date()
            },
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');
        
        res.status(200).json({
            success: true,
            message: 'Shop banner uploaded successfully',
            bannerUrl: result.secure_url,
            shop: updatedAdmin
        });
        
    } catch (error) {
        console.error('Error uploading shop banner:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload shop banner',
            error: error.message
        });
    }
};

// Get all shops (for customer browsing)
const getAllShops = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 12, 
            category, 
            search, 
            sortBy = 'shopRating',
            sortOrder = 'desc'
        } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build query
        const query = {
            role: 'admin',
            shopName: { $ne: '', $exists: true },
            isActive: true
        };
        
        // Add category filter
        if (category && category !== 'all') {
            query.shopCategory = category;
        }
        
        // Add search filter
        if (search && search.trim() !== '') {
            query.$or = [
                { shopName: { $regex: search.trim(), $options: 'i' } },
                { shopDescription: { $regex: search.trim(), $options: 'i' } }
            ];
        }
        
        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const shops = await User.find(query)
            .select('shopName shopDescription shopLogo shopBanner shopCategory shopRating shopReviewCount shopEstablished baseRegion baseCity')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get product count for each shop
        const shopsWithStats = await Promise.all(
            shops.map(async (shop) => {
                const productCount = await Product.countDocuments({ createdBy: shop._id });
                return {
                    ...shop.toObject(),
                    productCount
                };
            })
        );
        
        // Get total count for pagination
        const totalShops = await User.countDocuments(query);
        
        res.status(200).json({
            success: true,
            shops: shopsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalShops / parseInt(limit)),
                totalShops,
                hasNext: parseInt(page) < Math.ceil(totalShops / parseInt(limit)),
                hasPrev: parseInt(page) > 1
            }
        });
        
    } catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shops',
            error: error.message
        });
    }
};

// Get single shop details (public view)
const getShopDetails = async (req, res) => {
    try {
        const { shopId } = req.params;
        
        const shop = await User.findById(shopId)
            .select('shopName shopDescription shopLogo shopBanner shopCategory shopRating shopReviewCount shopEstablished baseRegion baseCity shopPolicies shopWebsite')
            .where({ role: 'admin', isActive: true });
        
        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }
        
        // Get shop products
        const products = await Product.find({ createdBy: shopId })
            .sort({ createdAt: -1 })
            .limit(12);
        
        // Get shop statistics
        const totalProducts = await Product.countDocuments({ createdBy: shopId });
        const totalOrders = await Order.countDocuments({
            'cartItems.adminId': shopId.toString()
        });
        
        const shopStats = {
            totalProducts,
            totalOrders,
            memberSince: shop.shopEstablished || shop.createdAt
        };
        
        res.status(200).json({
            success: true,
            shop: {
                ...shop.toObject(),
                stats: shopStats
            },
            recentProducts: products
        });
        
    } catch (error) {
        console.error('Error fetching shop details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shop details',
            error: error.message
        });
    }
};

// Get shop categories for filtering
const getShopCategories = async (req, res) => {
    try {
        const categories = await User.distinct('shopCategory', {
            role: 'admin',
            shopName: { $ne: '', $exists: true },
            isActive: true,
            shopCategory: { $ne: '', $exists: true }
        });
        
        // Add counts for each category
        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                const count = await User.countDocuments({
                    role: 'admin',
                    shopCategory: category,
                    shopName: { $ne: '', $exists: true },
                    isActive: true
                });
                return { name: category, count };
            })
        );
        
        res.status(200).json({
            success: true,
            categories: categoriesWithCounts.sort((a, b) => b.count - a.count)
        });
        
    } catch (error) {
        console.error('Error fetching shop categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shop categories',
            error: error.message
        });
    }
};

module.exports = {
    getShopProfile,
    updateShopProfile,
    uploadShopLogo,
    uploadShopBanner,
    getAllShops,
    getShopDetails,
    getShopCategories
}; 