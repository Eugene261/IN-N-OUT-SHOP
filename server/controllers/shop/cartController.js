const Cart = require('../../models/cart');
const Product = require('../../models/Products');
const asyncHandler = require('../../utils/asyncHandler');

const addToCart = asyncHandler(async(req, res) => {
    const {userId, productId, quantity, size, color, price, title, image, adminId, adminName} = req.body;
    // Removed salePrice from destructuring as we don't want to use it

    if(!userId || !productId || quantity <= 0 || !size || !color) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data provided. Size and color are required.'
        });
    }

    // Still fetch the product to verify it exists
    const product = await Product.findById(productId);

    if(!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    let cart = await Cart.findOne({userId});

    if(!cart){
        cart = new Cart({userId, items: []});
    }

    const findCurrentProductIndex = cart.items.findIndex(item => 
        item.productId && item.productId.toString() === productId &&
        item.size === size && item.color === color
    );

    // Use product data from database as a fallback
    // We only use the price field - not salePrice - as the actual purchase price
    const productPrice = price || product.price;
    const productTitle = title || product.title;
    const productImage = image || product.image;

    // Store extra product information directly in the cart item
    if(findCurrentProductIndex === -1){
        // Always use the product's createdBy as adminId if available
        const productAdminId = product.createdBy ? product.createdBy.toString() : null;
        console.log('Adding product to cart with adminId:', productAdminId || adminId || 'unknown');
        
        cart.items.push({
            productId, 
            quantity, 
            size, 
            color,
            price: productPrice,
            title: productTitle,
            image: productImage,
            adminId: productAdminId || adminId || 'unknown',
            adminName: adminName || 'Vendor'
        });
        // Removed salePrice field from cart items
    } else {
        cart.items[findCurrentProductIndex].quantity += quantity;
        // Update product information if provided
        if (productPrice) cart.items[findCurrentProductIndex].price = productPrice;
        if (productTitle) cart.items[findCurrentProductIndex].title = productTitle;
        if (productImage) cart.items[findCurrentProductIndex].image = productImage;
        
        // Update vendor information if provided, but prioritize product.createdBy
        const productAdminId = product.createdBy ? product.createdBy.toString() : null;
        if (productAdminId) {
            cart.items[findCurrentProductIndex].adminId = productAdminId;
            console.log('Updated cart item adminId to product createdBy:', productAdminId);
        } else if (adminId) {
            cart.items[findCurrentProductIndex].adminId = adminId;
        }
        
        if (adminName) cart.items[findCurrentProductIndex].adminName = adminName;
        // Removed salePrice update
    }

    await cart.save();

    res.status(200).json({
        success: true,
        data: cart,
        // Add itemUpdated flag to indicate whether an existing item was updated
        itemUpdated: findCurrentProductIndex !== -1
    });
});

const fetchCartItems = asyncHandler(async(req, res) => {
    const {userId} = req.params;

    if(!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is mandatory'
        });
    }

    const cart = await Cart.findOne({userId}).populate({
        path: 'items.productId', // FIXED from 'item.productId'
        select: 'image title price' // Removed salePrice to ensure it's not used
    });

    if(!cart){
        return res.status(200).json({ // Return empty cart rather than error
            success: true,
            data: { userId, items: [] }
        });
    }

    const validItems = cart.items.filter(productItem => productItem.productId);

    if(validItems.length < cart.items.length) {
        cart.items = validItems;
        await cart.save();
    }

    const populatedCartItems = validItems.map(item => ({
        productId: item.productId._id,
        image: item.productId.image,
        title: item.productId.title,
        price: item.productId.price,
        // salePrice: item.productId.salePrice,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        // Include vendor information
        adminId: item.adminId || item.productId.createdBy,
        adminName: item.adminName || 'Vendor'
    }));

    res.status(200).json({
        success: true,
        data: {
            ...cart._doc,
            items: populatedCartItems
        }
    });
});

const updateCartItemQuantity = asyncHandler(async(req, res) => {
    const {userId, productId, quantity, size, color} = req.body;

    if(!userId || !productId || quantity <= 0 || !size || !color) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data provided. Size and color are required.'
        });
    }

    const cart = await Cart.findOne({userId});

    if(!cart) {
        return res.status(404).json({
            success: false,
            message: 'Cart not found!'
        });
    }

    const findCurrentProductIndex = cart.items.findIndex(item => 
        item.productId && item.productId.toString() === productId &&
        item.size === size && item.color === color
    );

    if (findCurrentProductIndex === -1) {
        return res.status(404).json({ // FIXED from res(404)
            success: false,
            message: 'Cart item not present'
        });
    }

    cart.items[findCurrentProductIndex].quantity = quantity;

    await cart.save();

    await cart.populate({
        path: 'items.productId',
        select: 'image title price salePrice',
    });

    const populatedCartItems = cart.items.map(item => ({
        productId: item.productId ? item.productId._id : null,
        image: item.productId ? item.productId.image : null,
        title: item.productId ? item.productId.title : 'Product not found',
        price: item.productId ? item.productId.price : null,
        // salePrice: item.productId ? item.productId.salePrice : null,
        quantity: item.quantity,
        size: item.size,
        color: item.color
    }));

    res.status(200).json({
        success: true,
        data: {
            ...cart._doc,
            items: populatedCartItems
        }
    });
});

const deleteCartItem = asyncHandler(async(req, res) => {
    const {userId, productId} = req.params;
    const {size, color} = req.query; // Get size and color from query parameters
    
    if(!userId || !productId || !size || !color) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data provided. Size and color are required.'
        });
    }

    const cart = await Cart.findOne({userId}).populate({
        path: 'items.productId',
        select: 'image title price', // Removed salePrice
    });

    if(!cart) {
        return res.status(404).json({
            success: false,
            message: 'Cart not found!'
        });
    }

    cart.items = cart.items.filter(item => 
        !(item.productId && 
          item.productId._id.toString() === productId && 
          item.size === size && 
          item.color === color)
    );
    
    await cart.save();

    await cart.populate({ // FIXED from Cart.populate
        path: 'items.productId',
        select: 'image title price', // Removed salePrice
    });

    const populatedCartItems = cart.items.map(item => ({
        productId: item.productId ? item.productId._id : null,
        image: item.productId ? item.productId.image : null,
        title: item.productId ? item.productId.title : 'Product not found',
        price: item.productId ? item.productId.price : null,
        salePrice: item.productId ? item.productId.salePrice : null,
        quantity: item.quantity,
        size: item.size,
        color: item.color
    }));

    res.status(200).json({
        success: true,
        data: {
            ...cart._doc,
            items: populatedCartItems
        }
    });
});

const clearCart = asyncHandler(async(req, res) => {
    // Get userId from either params, body, or query
    let userId = req.params.userId;
    
    // If not in params, try to get from body or query
    if (!userId) {
        if (req.body && req.body.userId) {
            userId = req.body.userId;
        } else if (req.query && req.query.userId) {
            userId = req.query.userId;
        }
    }
    
    // Log the request for debugging
    console.log('Clear cart request received:', {
        method: req.method,
        url: req.url,
        params: req.params,
        body: req.body,
        query: req.query,
        userId: userId
    });
    
    if(!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required'
        });
    }

    // Try to find all carts for this user (in case of duplicates)
    const carts = await Cart.find({ userId });
    
    if(!carts || carts.length === 0) {
        return res.status(200).json({
            success: true,
            message: 'No cart found for this user',
            data: { userId, items: [] }
        });
    }
    
    // Delete all carts found for this user
    let deleteCount = 0;
    for (const cart of carts) {
        await Cart.findByIdAndDelete(cart._id);
        deleteCount++;
    }
    
    // Log the deletion for debugging
    console.log(`${deleteCount} carts for user ${userId} have been completely deleted`);
    
    // Set a flag to identify this was a manual cart clear
    res.locals.cartCleared = true;
    
    res.status(200).json({
        success: true,
        message: `${deleteCount} carts deleted successfully`,
        data: { userId, items: [] }
    });
});

module.exports = {
    addToCart,
    updateCartItemQuantity,
    fetchCartItems,
    deleteCartItem,
    clearCart
};