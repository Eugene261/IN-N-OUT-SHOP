const express = require('express');
const { addAddress, fetchAddress, updateAddress, deleteAddress } = require('../../controllers/shop/addressController');


const router = express.Router();


router.post('/add', addAddress);
router.get('/get/:userId', fetchAddress);
router.put('/update/:userId/:addressId', updateAddress);
router.delete('/delete/:userId/:addressId', deleteAddress);







module.exports = router;