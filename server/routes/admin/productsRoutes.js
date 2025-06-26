const express = require('express');

const { 
    handleImageUpload, 
    addProduct, 
    editProduct, 
    deleteProduct, 
    fetchAllProducts,
    fetchMyProductsWithStatus
} = require('../../controllers/admin/productsController.js');
const { authMiddleware } = require('../../controllers/authController.js');

const {upload} = require('../../helpers/cloudinary.js');


const router = express.Router();


router.post('/upload-image', upload.single('my_file'), handleImageUpload);
router.post('/add', authMiddleware,  addProduct);
router.put('/edit/:id', authMiddleware,  editProduct);
router.delete('/delete/:id', authMiddleware,  deleteProduct);
router.get('/get', authMiddleware,  fetchAllProducts);
router.get('/my-products', authMiddleware,  fetchMyProductsWithStatus);





module.exports = router;