const Order = require('../../models/Order.js');
const Cart = require('../../models/cart.js');
const paypal = require('../../helpers/paypal.js');
const Product = require('../../models/Products.js');



const createOrder = async(req, res) => {
    try {
            const {
                userId, 
                cartItems,
                addressInfo,
                orderStatus, 
                paymentMethod,
                paymentStatus,
                totalAmount,
                orderDate,
                orderUpdateDate,
                paymentId ,
                payerId,
                cartId
            } = req.body;


            // Basic validation
        if (!userId || !cartItems || !addressInfo || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required order information'
            });
        }

        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart items must be a non-empty array'
            });
        }

            const create_payment_json = {
                intent : 'sale',
                payer : {
                    payment_method : 'paypal'
                },
                redirect_urls : {
                    return_url : 'http://localhost:5173/shop/paypal-return',
                    cancel_url : 'http://localhost:5173/shop/paypal-cancel'
                },
                transactions : [
                    {
                        item_list : {
                            items : cartItems.map(item => ({
                                name : item.title,
                                sku : item.productId,
                                price : item.price.toFixed(2),
                                currency : 'USD',
                                quantity : item.quantity
                            }))
                        },
                        amount : {
                            currency : 'USD',
                            total : totalAmount.toFixed(2)
                        },
                        description : 'description'
                    }
                ]
            };

            paypal.payment.create(create_payment_json, async(error, paymentInfo) => {
                if(error){
                    console.log(error);


                    return res.status(500).json({
                        success : false,
                        message : 'Error while making paypal payment'
                    })
                    
                } else{
                    const newlyCreatedOrder = new Order({
                        user: userId, 
                        userId, 
                        cartId,
                        cartItems,
                        addressInfo,
                        orderStatus, 
                        paymentMethod,
                        paymentStatus,
                        totalAmount,
                        orderDate,
                        orderUpdateDate,
                        paymentId,
                        payerId
                    })


                    await newlyCreatedOrder.save();


                    const approvalURL = paymentInfo.links.find(link => link.rel === 'approval_url').href;

                    res.status(201).json({
                        success : true,
                        approvalURL,
                        orderId : newlyCreatedOrder._id
                    })
                }
            })



    } catch (error) {
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'An error occured'
        })
        
    }
}


const capturePayment = async(req, res) => {
    try {

        const { paymentId, payerId, orderId} = req.body;


        // Validate required params
        if (!paymentId || !payerId || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment parameters'
            });
        }

        let order = await Order.findById(orderId)

        if(!order){
            return res.status(400).json({
                success: false,
                message: 'Order can not be found'
            });
        }

        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.paymentId = paymentId;
        order.payerId = payerId;

        for (let item of order.cartItems){
            let product = await Product.findById(item.productId);

            if(!product){
                return res.status(404).json({
                    success : false,
                    message : `Out of stock for this product ${product.title}`
                })
            }
            product.totalStock  -= item.quantity

            await product.save();
        }

        const getCartId = order.cartId;
        await Cart.findByIdAndDelete(getCartId)


        await order.save();


        res.status(200).json({
            success: true,
            message: 'Payment completed successfully',
            data : order
        });



        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'An error occured'
        })
        
    }
}


const getAllOrdersByUser = async(req, res) => {

    try {
        
        const {userId} = req.params;

        const orders = await Order.find({userId})

        if(!orders.length){
            return res.status(404).json({
                success : false,
                message : 'No orders found'
            })
        }

        res.status(200).json({
            success : true,
            data : orders
        })


    } catch (error) {
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'An error occured'
        })
    }
}


const getOrdersDetails = async(req, res) => {

    try {

        const { id }  = req.params;

        const order = await Order.findById(id)

        if(!order){
            return res.status(404).json({
                success : false,
                message : 'Order not found'
            })
        }


        res.status(200).json({
            success : true,
            data : order
        })
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'An error occured'
        })
    }
}






module.exports = {
    createOrder,
    capturePayment,
    getAllOrdersByUser,
    getOrdersDetails
};