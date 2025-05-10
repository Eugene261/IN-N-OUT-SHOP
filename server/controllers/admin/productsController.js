const { ImageUploadUtil } = require("../../helpers/cloudinary");
const Product = require('../../models/Products.js');

const handleImageUpload = async (req, res) => {
    try {
        // 1. Check if file exists
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // 2. Create proper base64 string
        const b64 = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // 3. Upload to Cloudinary
        const result = await ImageUploadUtil(dataURI);

        // 4. Return success response
        res.status(200).json({
            success: true,
            result
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error occurred during image upload',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Add a new Product
const addProduct = async(req, res) => {
    try {
        console.log('Add product request received:', req.body);
        console.log('User in request:', req.user);
        
        const {
            image, 
            additionalImages, 
            title, 
            description, 
            category, 
            brand, 
            price, 
            salePrice, 
            totalStock,
            sizes,
            colors,
            isBestseller,
            isNewArrival
        } = req.body;

        // Check for required fields
        if (!title || !description || !category) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing'
            });
        }

        // Get the admin ID from the authenticated user
        if (!req.user || !req.user.id) {
            console.log('User ID not found in request:', req.user);
            return res.status(401).json({
                success: false,
                message: 'Authentication error: User ID not found'
            });
        }

        const adminId = req.user.id;
        console.log('Admin ID extracted:', adminId);

        const newlyCreatedProducts = new Product({
            image, 
            additionalImages: additionalImages || [],
            title, 
            description, 
            category, 
            brand, 
            price: price || 0, 
            salePrice: salePrice || 0, 
            totalStock: totalStock || 0,
            sizes: sizes || [],
            colors: colors || [],
            isBestseller: isBestseller || false,
            isNewArrival: isNewArrival || false,
            createdBy: adminId
        });

        console.log('Saving product with data:', newlyCreatedProducts);
        const savedProduct = await newlyCreatedProducts.save();
        console.log('Product saved successfully:', savedProduct);

        res.status(201).json({
            success: true,
            data: savedProduct
        });

    } catch (error) {
        console.error('Full error in addProduct:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding the product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
};

// Migrate legacy products to assign them to the current admin
const migrateProductsToAdmin = async (adminId) => {
    try {
        // Find products without a createdBy field
        const legacyProducts = await Product.find({
            $or: [
                { createdBy: { $exists: false } },
                { createdBy: null }
            ]
        });
        
        console.log(`Found ${legacyProducts.length} legacy products to migrate`);
        
        // Update all legacy products to assign them to the current admin
        if (legacyProducts.length > 0) {
            const updateResult = await Product.updateMany(
                {
                    $or: [
                        { createdBy: { $exists: false } },
                        { createdBy: null }
                    ]
                },
                { $set: { createdBy: adminId } }
            );
            
            console.log(`Migrated ${updateResult.modifiedCount} legacy products to admin ${adminId}`);
        }
    } catch (error) {
        console.error('Error migrating products:', error);
    }
};

// Fetch all products by current admin
const fetchAllProducts = async (req, res) => {
    try {
        // Get the admin ID from the authenticated user
        const adminId = req.user._id || req.user.id;
        console.log('Fetching products for admin ID:', adminId);
        
        // Find only products created by this admin
        const adminProducts = await Product.find({ createdBy: adminId });
        console.log(`Found ${adminProducts.length} products for admin ID: ${adminId}`);
        
        res.status(200).json({
            success: true,
            data: adminProducts
        });

    } catch (error) {
        console.log('Error in fetchAllProducts:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

// Edit a product
const editProduct = async (req, res) => {
    try {
        const {id} = req.params;
        const {
            image, 
            additionalImages,
            title, 
            description, 
            category, 
            brand, 
            price, 
            salePrice, 
            totalStock,
            sizes,
            colors,
            isBestseller,
            isNewArrival
        } = req.body;

        // Get the admin ID from the authenticated user
        const adminId = req.user._id || req.user.id;

        // First check if the product exists
        let findProduct = await Product.findById(id);
        
        if(!findProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Check if the product was created by the current admin
        if (findProduct.createdBy && findProduct.createdBy.toString() !== adminId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this product'
            });
        }

        // Prepare update object with all fields
        const updateData = {};
        
        // Only update fields that are provided
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (brand !== undefined) updateData.brand = brand;
        if (price !== undefined) updateData.price = price === '' ? 0 : Number(price);
        if (salePrice !== undefined) updateData.salePrice = salePrice === '' ? 0 : Number(salePrice);
        if (totalStock !== undefined) updateData.totalStock = totalStock === '' ? 0 : Number(totalStock);
        if (image) updateData.image = image;
        
        // Update arrays if provided
        if (additionalImages !== undefined) {
            // Ensure additionalImages is always stored as an array
            if (Array.isArray(additionalImages)) {
                updateData.additionalImages = additionalImages;
                console.log(`Setting additionalImages to array with ${additionalImages.length} items`);
            } else if (additionalImages === null) {
                updateData.additionalImages = [];
                console.log('Setting additionalImages to empty array');
            }
        }
        
        if (Array.isArray(sizes)) updateData.sizes = sizes;
        if (Array.isArray(colors)) updateData.colors = colors;

        // Only SuperAdmin can update bestseller and new arrival flags
        if (req.user.role === 'superAdmin') {
            if (isBestseller !== undefined) updateData.isBestseller = isBestseller;
            if (isNewArrival !== undefined) updateData.isNewArrival = isNewArrival;
        }
        
        // Add updatedAt timestamp
        updateData.updatedAt = new Date();
        
        console.log('Updating product with data:', updateData);

        // Use findByIdAndUpdate for a direct update
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true } // Return the updated document and run validators
        ).populate('createdBy', 'userName email');
        
        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Failed to update product'
            });
        }
        
        console.log('Product updated successfully with ID:', updatedProduct._id);
        console.log('Updated product title:', updatedProduct.title);
        console.log('Updated product price:', updatedProduct.price);
        
        // Return the updated product data to the client
        res.status(200).json({
            success: true,
            data: updatedProduct,
            timestamp: new Date().toISOString() // Add timestamp to prevent caching issues
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const {id} = req.params;
        
        // Get the admin ID from the authenticated user
        const adminId = req.user._id || req.user.id;
        
        // First check if the product exists and belongs to the current admin
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Check if the product was created by the current admin
        if (product.createdBy && product.createdBy.toString() !== adminId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this product'
            });
        }
        
        // Delete the product if it belongs to the current admin
        await Product.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

// Toggle a product's bestseller status - SuperAdmin only
const toggleProductBestseller = async (req, res) => {
    try {
        const { productId } = req.params;
        
        // Check if user is SuperAdmin
        if (req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only SuperAdmin can set bestseller status.'
            });
        }
        
        // Find the product
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Toggle the bestseller status
        product.isBestseller = !product.isBestseller;
        await product.save();
        
        res.status(200).json({
            success: true,
            data: product
        });
        
    } catch (error) {
        console.error('Error toggling bestseller status:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

// Toggle a product's new arrival status - SuperAdmin only
const toggleProductNewArrival = async (req, res) => {
    try {
        const { productId } = req.params;
        
        // Check if user is SuperAdmin
        if (req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only SuperAdmin can set new arrival status.'
            });
        }
        
        // Find the product
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Toggle the new arrival status
        product.isNewArrival = !product.isNewArrival;
        await product.save();
        
        res.status(200).json({
            success: true,
            data: product
        });
        
    } catch (error) {
        console.error('Error toggling new arrival status:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

// Get all feature images
const getFeatureImages = async (req, res) => {
    try {
        // Assuming you have a FeatureImage model or storing feature images in Product model
        // For now, let's return a placeholder response
        res.status(200).json({
            success: true,
            data: []
        });
        
    } catch (error) {
        console.error('Error getting feature images:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

// Add a feature image
const addFeatureImage = async (req, res) => {
    try {
        // Assuming you have a FeatureImage model or storing feature images in Product model
        // For now, let's return a placeholder response
        res.status(201).json({
            success: true,
            data: { id: 'placeholder-id' }
        });
        
    } catch (error) {
        console.error('Error adding feature image:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

// Delete a feature image
const deleteFeatureImage = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Assuming you have a FeatureImage model or storing feature images in Product model
        // For now, let's return a placeholder response
        res.status(200).json({
            success: true,
            message: 'Feature image deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting feature image:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

module.exports = {
    handleImageUpload,
    addProduct,
    fetchAllProducts,
    editProduct,
    deleteProduct,
    toggleProductBestseller,
    toggleProductNewArrival,
    getFeatureImages,
    addFeatureImage,
    deleteFeatureImage
};