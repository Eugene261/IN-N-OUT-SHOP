const Cart = require('../../models/cart');
const Product = require('../../models/Products');

const addToCart = async(req, res) => {
    try {
        const {userId, productId, quantity, size, color} = req.body;

        if(!userId || !productId || quantity <= 0 || !size || !color) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data provided. Size and color are required.'
            });
        }

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

        if(findCurrentProductIndex === -1){
            cart.items.push({productId, quantity, size, color});
        } else {
            cart.items[findCurrentProductIndex].quantity += quantity;
        }

        await cart.save();

        res.status(200).json({
            success: true,
            data: cart
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

const fetchCartItems = async(req, res) => {
    try {
        const {userId} = req.params;

        if(!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is mandatory'
            });
        }

        const cart = await Cart.findOne({userId}).populate({
            path: 'items.productId', // FIXED from 'item.productId'
            select: 'image title price salePrice'
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
            salePrice: item.productId.salePrice,
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

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message // Include error message for debugging
        });
    }
};

const updateCartItemQuantity = async(req, res) => {
    try {
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

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
};

const deleteCartItem = async(req, res) => {
    try {
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
            select: 'image title price salePrice',
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
            select: 'image title price salePrice',
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

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
};

module.exports = {
    addToCart,
    updateCartItemQuantity,
    fetchCartItems,
    deleteCartItem
};