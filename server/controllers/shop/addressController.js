const Address = require('../../models/Address.js');

const addAddress = async (req, res) => {
    try {

        const {userId, region, address, city, phone, notes} = req.body;

        if(!userId || !address || !region || !city || !phone || !notes) {
            return res.status(400).json({
                success : false,
                message : 'Invalid data provided!'
            })
        }

        const newlyCreatedAddres = new Address({
            userId, region, address, city, phone, notes
        })

        await newlyCreatedAddres.save();

        res.status(201).json({
            success : true,
            data : newlyCreatedAddres
        })

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
};


const fetchAddress = async (req, res) => {
    try {
        const { userId } = req.params;

        if(!userId) {
            return res.status(400).json({
                success : false,
                message : 'User ID is required!'
            });
        }

        const addressList = await Address.find({userId: userId});

        return res.status(200).json({
            success : true,
            data : addressList
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
};

const updateAddress = async (req, res) => {
    try {

        const { userId, addressId } = req.params
        const formData = req.body;

        if(!userId || !addressId ) {
            return res.status(400).json({
                success : false,
                message : 'User ID and address ID is required!'
            }
        )};

        const address = await Address.findOneAndUpdate({
            _id : addressId,
            userId
        },
        formData,
        {new : true}
    );

    if(!address ) {
        return res.status(404).json({
            success : false,
            message : 'Address not found!'
        })
    }


    res.status(200).json({
        success : true,
        data : address
    })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
};


const deleteAddress = async (req, res) => {
    try {

        const { userId, addressId } = req.params;

        if(!userId || !addressId ) {
            return res.status(400).json({
                success : false,
                message : 'User ID and address ID is required!'
            }
        )};

        const address = await Address.findOneAndDelete({
            _id : addressId,
            userId
        });

        if(!address ) {
            return res.status(404).json({
                success : false,
                message : 'Address not found!'
            })
        }

        res.status(200).json({
            success : true,
            message : 'Address deleted successfully!'
        })



        
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
    addAddress,
    fetchAddress,
    updateAddress,
    deleteAddress
};