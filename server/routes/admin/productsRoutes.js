const express = require('express');

const { 
    handleImageUpload, 
    addProduct, 
    editProduct, 
    deleteProduct, 
    fetchAllProducts,
    fetchMyProductsWithStatus,
    getBulkProductsByIds,
    bulkDeleteProducts,
    getProductAnalytics,
    updateProductStatus,
    getFeatureImages,
    addFeatureImage,
    deleteFeatureImage,
    getFormConfiguration
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
router.get('/form-config', getFormConfiguration);
router.post('/bulk-get', getBulkProductsByIds);
router.delete('/bulk-delete', bulkDeleteProducts);
router.get('/analytics', getProductAnalytics);
router.patch('/status/:id', updateProductStatus);
router.get('/feature-images', getFeatureImages);
router.post('/feature-images', addFeatureImage);
router.delete('/feature-images/:id', deleteFeatureImage);





module.exports = router;