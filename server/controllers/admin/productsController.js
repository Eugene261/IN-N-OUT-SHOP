const { ImageUploadUtil } = require("../../helpers/cloudinary");
const Product = require('../../models/Products.js');
const User = require('../../models/User.js');
const emailService = require('../../services/emailService.js');
const { featureFlags } = require('../../utils/featureFlags');
const cloudinary = require('cloudinary').v2;
const { uploadToCloudinary, deleteFromCloudinary } = require('../../helpers/cloudinary');

// Safe ProductTemplate imports with error handling
let ProductTemplate, ProductTemplateService;
try {
  ProductTemplate = require('../../models/ProductTemplate');
  ProductTemplateService = require('../../services/productTemplateService');
  console.log('✅ ProductTemplate system loaded successfully');
} catch (error) {
  console.warn('⚠️ ProductTemplate system not available:', error.message);
  ProductTemplate = null;
  ProductTemplateService = null;
}

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

// ========================================
// ENHANCED FORM CONFIGURATION
// ========================================

// Get dynamic form configuration based on category
const getFormConfiguration = async (req, res) => {
    try {
        const { category, productType = 'physical' } = req.query;
        
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }
        
        console.log(`🔍 Getting form configuration for category: ${category}, type: ${productType}`);
        
        // ========================================
        // SAFE PRODUCTTEMPLATE INTEGRATION
        // ========================================
        
        // Check if ProductTemplate system is available
        if (!ProductTemplateService || !ProductTemplate) {
            console.warn('⚠️ ProductTemplate system not available, using fallback');
            
            // Fallback configuration based on category
            const fallbackConfig = {
                fieldRequirements: {
                    sizes: category !== 'devices',
                    colors: true,
                    brand: true,
                    weight: category === 'devices',
                    dimensions: category === 'devices'
                },
                customFields: [],
                validationRules: {}
            };
            
            return res.status(200).json({
                success: true,
                data: {
                    category,
                    productType,
                    fieldRequirements: fallbackConfig.fieldRequirements,
                    customFields: fallbackConfig.customFields,
                    validationRules: fallbackConfig.validationRules,
                    availableTemplates: [],
                    fallbackMode: true
                }
            });
        }
        
        try {
            // Get enhanced form configuration using template service
            const formConfig = await ProductTemplateService.getEnhancedFormConfig(category, productType);
            
            // Get available templates for this category
            const availableTemplates = await ProductTemplate.getTemplatesForCategory(category);
            
            console.log('📋 Form configuration:', {
                fieldRequirements: formConfig.fieldRequirements,
                customFieldsCount: formConfig.customFields.length,
                templatesCount: availableTemplates.length
            });
            
            res.status(200).json({
                success: true,
                data: {
                    category,
                    productType,
                    fieldRequirements: formConfig.fieldRequirements,
                    customFields: formConfig.customFields,
                    validationRules: formConfig.adaptedValidation,
                    availableTemplates: availableTemplates.map(template => ({
                        id: template._id,
                        name: template.name,
                        description: template.description,
                        examples: template.examples
                    })),
                    templateSystemActive: true
                }
            });
            
        } catch (templateError) {
            console.error('❌ ProductTemplate error, using fallback:', templateError.message);
            
            // Fallback if template system fails
            const fallbackConfig = {
                fieldRequirements: {
                    sizes: category !== 'devices',
                    colors: true,
                    brand: true,
                    weight: category === 'devices',
                    dimensions: category === 'devices'
                },
                customFields: [],
                validationRules: {}
            };
            
            res.status(200).json({
                success: true,
                data: {
                    category,
                    productType,
                    fieldRequirements: fallbackConfig.fieldRequirements,
                    customFields: fallbackConfig.customFields,
                    validationRules: fallbackConfig.validationRules,
                    availableTemplates: [],
                    fallbackMode: true,
                    templateError: templateError.message
                }
            });
        }
        
    } catch (error) {
        console.error('Error getting form configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting form configuration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Add a new Product with enhanced template support
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
            subCategory, 
            brand, 
            price, 
            salePrice, 
            totalStock,
            sizes,
            colors,
            isBestseller,
            isNewArrival,
            // New enhanced fields
            productType = 'physical',
            customAttributes = {},
            templateId,
            weight,
            dimensions
        } = req.body;

        // Enhanced validation based on product template
        if (!title || !description || !category) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing'
            });
        }

        // Get template-based validation rules with fallback
        let formConfig, fieldRequirements;
        
        try {
            if (ProductTemplateService) {
                formConfig = await ProductTemplateService.getEnhancedFormConfig(category, productType);
                fieldRequirements = formConfig.fieldRequirements;
                console.log('📋 Using template-based field requirements:', fieldRequirements);
            } else {
                throw new Error('ProductTemplateService not available');
            }
        } catch (templateError) {
            console.warn('⚠️ ProductTemplate validation failed, using fallback:', templateError.message);
            
            // Fallback field requirements
            fieldRequirements = {
                sizes: category !== 'devices',
                colors: true,
                brand: true,
                weight: category === 'devices',
                dimensions: category === 'devices'
            };
            
            formConfig = { 
                fieldRequirements, 
                customFields: [] 
            };
            
            console.log('📋 Using fallback field requirements:', fieldRequirements);
        }
        
        // Enhanced validation based on field requirements
        const validationErrors = [];
        
        if (fieldRequirements.brand && !brand) {
            validationErrors.push('Brand is required for this product type');
        }
        
        if (fieldRequirements.sizes && (!sizes || sizes.length === 0)) {
            validationErrors.push('At least one size is required for this product type');
        }
        
        if (fieldRequirements.weight && !weight) {
            validationErrors.push('Weight is required for this product type');
        }
        
        if (fieldRequirements.dimensions && (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height)) {
            validationErrors.push('Dimensions are required for this product type');
        }
        
        // Validate custom fields
        if (formConfig.customFields && formConfig.customFields.length > 0) {
            for (const customField of formConfig.customFields) {
                if (customField.required && !customAttributes[customField.name]) {
                    validationErrors.push(`${customField.label} is required`);
                }
            }
        }
        
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
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

        // ========================================
        // PRODUCT APPROVAL INTEGRATION
        // ========================================
        
        // Determine initial approval status based on feature flags
        let initialApprovalStatus = 'approved'; // Default for backward compatibility
        let requiresApproval = false;
        
        if (featureFlags.isProductApprovalEnabled()) {
            // Check if this admin should auto-approve
            if (featureFlags.shouldAutoApprove(adminId)) {
                initialApprovalStatus = 'approved';
                console.log('Auto-approving product for trusted admin:', adminId);
            } else {
                initialApprovalStatus = 'pending';
                requiresApproval = true;
                console.log('Product requires approval for admin:', adminId);
            }
        }

        // Create enhanced product with flexible attributes
        const newlyCreatedProducts = new Product({
            image, 
            additionalImages: additionalImages || [],
            title, 
            description, 
            category, 
            subCategory: subCategory || '', 
            brand: fieldRequirements.brand ? brand : undefined, 
            price: price || 0, 
            salePrice: salePrice || 0, 
            totalStock: totalStock || 0,
            sizes: fieldRequirements.sizes ? (sizes || []) : [],
            colors: fieldRequirements.colors ? (colors || []) : [],
            isBestseller: isBestseller || false,
            isNewArrival: isNewArrival || false,
            createdBy: adminId,
            
            // ========================================
            // ENHANCED ATTRIBUTES SYSTEM
            // ========================================
            productType,
            customAttributes,
            fieldRequirements,
            weight: fieldRequirements.weight ? (weight || 0) : 0,
            dimensions: fieldRequirements.dimensions ? {
                length: dimensions?.length || 0,
                width: dimensions?.width || 0,
                height: dimensions?.height || 0
            } : { length: 0, width: 0, height: 0 },
            
            // ========================================
            // APPROVAL SYSTEM FIELDS
            // ========================================
            approvalStatus: initialApprovalStatus,
            submittedAt: new Date(),
            approvedAt: initialApprovalStatus === 'approved' ? new Date() : null,
            approvalComments: initialApprovalStatus === 'approved' ? 'Auto-approved' : '',
            qualityScore: 85 // Default good score
        });

        console.log('Saving product with approval status:', initialApprovalStatus);
        console.log('📦 Product type:', productType);
        console.log('🏷️ Custom attributes:', customAttributes);
        
        const savedProduct = await newlyCreatedProducts.save();
        console.log('Product saved successfully:', savedProduct._id);
        
        // ========================================
        // NOTIFICATION LOGIC
        // ========================================
        
        try {
            const admin = await User.findById(adminId);
            
            if (requiresApproval) {
                // Send approval request to SuperAdmins
                const superAdmins = await User.find({ role: 'superAdmin' });
                
                if (admin && superAdmins.length > 0) {
                    for (const superAdmin of superAdmins) {
                        await emailService.sendProductAddedNotificationEmail(
                            superAdmin.email,
                            {
                                userName: admin.userName,
                                email: admin.email,
                                shopName: admin.shopName,
                                createdAt: admin.createdAt
                            },
                            {
                                id: savedProduct._id,
                                title: savedProduct.title,
                                description: savedProduct.description,
                                price: savedProduct.price,
                                category: savedProduct.category,
                                brand: savedProduct.brand,
                                totalStock: savedProduct.totalStock,
                                image: savedProduct.image
                            }
                        );
                    }
                    console.log(`Product approval notifications sent to ${superAdmins.length} SuperAdmins`);
                }
                
                // Send confirmation to admin that product is pending
                if (admin) {
                    await emailService.sendEmail({
                        to: admin.email,
                        subject: '📋 Product Submitted for Review - ' + savedProduct.title,
                        html: `
                            <h2>Product Submitted Successfully!</h2>
                            <p>Hello ${admin.userName},</p>
                            <p>Your product "${savedProduct.title}" has been submitted for review.</p>
                            <p><strong>Status:</strong> Pending Review</p>
                            <p>You'll receive an email notification once the review is complete.</p>
                            <p>Thank you for your patience!</p>
                        `
                    });
                }
                
            } else {
                // Product auto-approved - send standard notification if approval system is disabled
                if (!featureFlags.isProductApprovalEnabled()) {
                    // Send existing notification logic for backward compatibility
                    const superAdmins = await User.find({ role: 'superAdmin' });
                    
                    if (admin && superAdmins.length > 0) {
                        for (const superAdmin of superAdmins) {
                            await emailService.sendProductAddedNotificationEmail(
                                superAdmin.email,
                                {
                                    userName: admin.userName,
                                    email: admin.email,
                                    shopName: admin.shopName,
                                    createdAt: admin.createdAt
                                },
                                {
                                    id: savedProduct._id,
                                    title: savedProduct.title,
                                    description: savedProduct.description,
                                    price: savedProduct.price,
                                    category: savedProduct.category,
                                    brand: savedProduct.brand,
                                    totalStock: savedProduct.totalStock,
                                    image: savedProduct.image
                                }
                            );
                        }
                        console.log(`Product added notifications sent to ${superAdmins.length} SuperAdmins`);
                    }
                }
            }
        } catch (emailError) {
            console.error('Failed to send notifications:', emailError);
            // Don't fail the product creation if email fails
        }

        // ========================================
        // RESPONSE BASED ON APPROVAL STATUS
        // ========================================
        
        const responseData = {
            success: true,
            data: savedProduct,
            approvalInfo: {
                requiresApproval,
                status: initialApprovalStatus,
                message: requiresApproval 
                    ? 'Product submitted for review. You\'ll be notified once approved.' 
                    : 'Product created and is now live!'
            }
        };

        res.status(201).json(responseData);

    } catch (error) {
        console.log('Error in addProduct:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Fetch admin's products with approval status information
const fetchMyProductsWithStatus = async (req, res) => {
    try {
        // Get the admin ID from the authenticated user
        const adminId = req.user._id || req.user.id;
        console.log('Fetching products with approval status for admin ID:', adminId);
        
        // Check if approval status should be included
        const includeApprovalStatus = req.query.includeApprovalStatus === 'true';
        const approvalStatusFilter = req.query.approvalStatus;
        
        // Build query
        let query = { createdBy: adminId };
        
        // Add approval status filter if specified
        if (approvalStatusFilter && approvalStatusFilter !== 'all') {
            query.approvalStatus = approvalStatusFilter;
        }
        
        // Find products with or without approval status
        let products;
        if (includeApprovalStatus) {
            // Include all approval status fields
            products = await Product.find(query)
                .select('+approvalStatus +approvalComments +approvedBy +submittedAt +approvedAt +rejectedAt')
                .populate('approvedBy', 'userName email')
                .sort({ submittedAt: -1 });
        } else {
            // Regular product fetch
            products = await Product.find(query);
        }
        
        console.log(`Found ${products.length} products for admin ID: ${adminId}`);
        
        res.status(200).json({
            success: true,
            data: products
        });

    } catch (error) {
        console.log('Error in fetchMyProductsWithStatus:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching products'
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
            subCategory, 
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
        if (subCategory !== undefined) updateData.subCategory = subCategory;
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
        
        // Check if stock is low and send alert
        if (updatedProduct.totalStock <= 5 && updatedProduct.totalStock > 0) {
            try {
                const admin = await User.findById(updatedProduct.createdBy);
                if (admin) {
                    await emailService.sendLowStockAlert(
                        admin.email,
                        admin.userName,
                        {
                            id: updatedProduct._id,
                            title: updatedProduct.title,
                            price: updatedProduct.price,
                            totalStock: updatedProduct.totalStock,
                            image: updatedProduct.image
                        }
                    );
                    console.log(`Low stock alert sent for product: ${updatedProduct.title} (${updatedProduct.totalStock} units left)`);
                }
            } catch (emailError) {
                console.error('Failed to send low stock alert:', emailError);
                // Don't fail the product update if email fails
            }
        }
        
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
    fetchMyProductsWithStatus,
    editProduct,
    deleteProduct,
    toggleProductBestseller,
    toggleProductNewArrival,
    getFeatureImages,
    addFeatureImage,
    deleteFeatureImage,
    getFormConfiguration
};