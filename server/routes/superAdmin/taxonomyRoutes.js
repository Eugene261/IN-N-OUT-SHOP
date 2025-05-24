const express = require('express');
const {
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Subcategories
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  
  // Brands
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  
  // Sizes
  getSizes,
  createSize,
  updateSize,
  deleteSize,
  
  // Colors
  getColors,
  createColor,
  updateColor,
  deleteColor,
  
  // Bulk
  getAllTaxonomyData,
  populateInitialTaxonomy
} = require('../../controllers/superAdmin/taxonomy-controller');

const router = express.Router();

// ================== CATEGORIES ==================
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ================== SUBCATEGORIES ==================
router.get('/subcategories', getSubcategories);
router.post('/subcategories', createSubcategory);
router.put('/subcategories/:id', updateSubcategory);
router.delete('/subcategories/:id', deleteSubcategory);

// ================== BRANDS ==================
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// ================== SIZES ==================
router.get('/sizes', getSizes);
router.post('/sizes', createSize);
router.put('/sizes/:id', updateSize);
router.delete('/sizes/:id', deleteSize);

// ================== COLORS ==================
router.get('/colors', getColors);
router.post('/colors', createColor);
router.put('/colors/:id', updateColor);
router.delete('/colors/:id', deleteColor);

// ================== BULK OPERATIONS ==================
router.get('/all', getAllTaxonomyData);
router.post('/populate', populateInitialTaxonomy);

module.exports = router; 