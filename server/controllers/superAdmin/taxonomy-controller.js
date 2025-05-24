const Category = require('../../models/Category');
const Subcategory = require('../../models/Subcategory');
const Brand = require('../../models/Brand');
const Size = require('../../models/Size');
const Color = require('../../models/Color');

// ================== CATEGORIES ==================

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const { name, description, image, icon, sortOrder, metaTitle, metaDescription } = req.body;
    
    const category = new Category({
      name,
      description,
      image,
      icon,
      sortOrder,
      metaTitle,
      metaDescription
    });

    await category.save();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has subcategories
    const subcategoriesCount = await Subcategory.countDocuments({ category: id });
    if (subcategoriesCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing subcategories'
      });
    }
    
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// ================== SUBCATEGORIES ==================

// Get all subcategories
const getSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { category: categoryId } : {};
    
    const subcategories = await Subcategory.find(filter)
      .populate('category', 'name slug')
      .sort({ sortOrder: 1, name: 1 });
      
    res.status(200).json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
};

// Create subcategory
const createSubcategory = async (req, res) => {
  try {
    const { name, description, category, image, sortOrder } = req.body;
    
    const subcategory = new Subcategory({
      name,
      description,
      category,
      image,
      sortOrder
    });

    await subcategory.save();
    await subcategory.populate('category', 'name slug');
    
    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: subcategory
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subcategory',
      error: error.message
    });
  }
};

// Update subcategory
const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const subcategory = await Subcategory.findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'name slug');
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Subcategory updated successfully',
      data: subcategory
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subcategory',
      error: error.message
    });
  }
};

// Delete subcategory
const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subcategory = await Subcategory.findByIdAndDelete(id);
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subcategory',
      error: error.message
    });
  }
};

// ================== BRANDS ==================

// Get all brands
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ sortOrder: 1, name: 1 });
    res.status(200).json({
      success: true,
      data: brands
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brands',
      error: error.message
    });
  }
};

// Create brand
const createBrand = async (req, res) => {
  try {
    const { name, description, logo, website, sortOrder, metaTitle, metaDescription } = req.body;
    
    const brand = new Brand({
      name,
      description,
      logo,
      website,
      sortOrder,
      metaTitle,
      metaDescription
    });

    await brand.save();
    
    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating brand',
      error: error.message
    });
  }
};

// Update brand
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const brand = await Brand.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      data: brand
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand',
      error: error.message
    });
  }
};

// Delete brand
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await Brand.findByIdAndDelete(id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting brand',
      error: error.message
    });
  }
};

// ================== SIZES ==================

// Get all sizes
const getSizes = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    
    const sizes = await Size.find(filter).sort({ category: 1, sortOrder: 1, name: 1 });
    res.status(200).json({
      success: true,
      data: sizes
    });
  } catch (error) {
    console.error('Error fetching sizes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sizes',
      error: error.message
    });
  }
};

// Create size
const createSize = async (req, res) => {
  try {
    const { name, code, category, description, measurements, sortOrder } = req.body;
    
    const size = new Size({
      name,
      code,
      category,
      description,
      measurements,
      sortOrder
    });

    await size.save();
    
    res.status(201).json({
      success: true,
      message: 'Size created successfully',
      data: size
    });
  } catch (error) {
    console.error('Error creating size:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating size',
      error: error.message
    });
  }
};

// Update size
const updateSize = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const size = await Size.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!size) {
      return res.status(404).json({
        success: false,
        message: 'Size not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Size updated successfully',
      data: size
    });
  } catch (error) {
    console.error('Error updating size:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating size',
      error: error.message
    });
  }
};

// Delete size
const deleteSize = async (req, res) => {
  try {
    const { id } = req.params;
    
    const size = await Size.findByIdAndDelete(id);
    
    if (!size) {
      return res.status(404).json({
        success: false,
        message: 'Size not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Size deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting size:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting size',
      error: error.message
    });
  }
};

// ================== COLORS ==================

// Get all colors
const getColors = async (req, res) => {
  try {
    const { colorFamily } = req.query;
    const filter = colorFamily ? { colorFamily } : {};
    
    const colors = await Color.find(filter).sort({ colorFamily: 1, sortOrder: 1, name: 1 });
    res.status(200).json({
      success: true,
      data: colors
    });
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching colors',
      error: error.message
    });
  }
};

// Create color
const createColor = async (req, res) => {
  try {
    const { name, code, hexCode, description, colorFamily, sortOrder } = req.body;
    
    const color = new Color({
      name,
      code,
      hexCode,
      description,
      colorFamily,
      sortOrder
    });

    await color.save();
    
    res.status(201).json({
      success: true,
      message: 'Color created successfully',
      data: color
    });
  } catch (error) {
    console.error('Error creating color:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating color',
      error: error.message
    });
  }
};

// Update color
const updateColor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const color = await Color.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!color) {
      return res.status(404).json({
        success: false,
        message: 'Color not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Color updated successfully',
      data: color
    });
  } catch (error) {
    console.error('Error updating color:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating color',
      error: error.message
    });
  }
};

// Delete color
const deleteColor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const color = await Color.findByIdAndDelete(id);
    
    if (!color) {
      return res.status(404).json({
        success: false,
        message: 'Color not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Color deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting color:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting color',
      error: error.message
    });
  }
};

// ================== BULK OPERATIONS ==================

// Get all taxonomy data at once (for admin forms)
const getAllTaxonomyData = async (req, res) => {
  try {
    const [categories, subcategories, brands, sizes, colors] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      Subcategory.find({ isActive: true }).populate('category', 'name slug').sort({ sortOrder: 1, name: 1 }),
      Brand.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      Size.find({ isActive: true }).sort({ category: 1, sortOrder: 1, name: 1 }),
      Color.find({ isActive: true }).sort({ colorFamily: 1, sortOrder: 1, name: 1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories,
        subcategories,
        brands,
        sizes,
        colors
      }
    });
  } catch (error) {
    console.error('Error fetching taxonomy data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching taxonomy data',
      error: error.message
    });
  }
};

// ================== BULK POPULATION ==================

// Populate initial taxonomy data
const populateInitialTaxonomy = async (req, res) => {
  try {
    console.log('🚀 Starting bulk taxonomy population...');

    // Categories data
    const categoriesData = [
      { name: 'Men', description: 'Men\'s clothing and accessories', sortOrder: 1 },
      { name: 'Women', description: 'Women\'s clothing and accessories', sortOrder: 2 },
      { name: 'Kids', description: 'Children\'s clothing and accessories', sortOrder: 3 },
      { name: 'Accessories', description: 'Bags, hats, and accessories', sortOrder: 4 },
      { name: 'Footwear', description: 'Shoes and sneakers', sortOrder: 5 },
      { name: 'Devices', description: 'Electronics and gadgets', sortOrder: 6 }
    ];

    // Clear existing data
    await Promise.all([
      Color.deleteMany({}),
      Size.deleteMany({}),
      Brand.deleteMany({}),
      Subcategory.deleteMany({}),
      Category.deleteMany({})
    ]);

    // Create categories
    const createdCategories = [];
    for (const catData of categoriesData) {
      const category = new Category({
        name: catData.name,
        description: catData.description,
        slug: catData.name.toLowerCase(),
        sortOrder: catData.sortOrder,
        isActive: true
      });
      const saved = await category.save();
      createdCategories.push(saved);
    }

    // Create some sample subcategories
    const subcategoriesData = [
      { name: 'T-Shirts & Tops', categoryName: 'Men', sortOrder: 1 },
      { name: 'Pants', categoryName: 'Men', sortOrder: 2 },
      { name: 'Shorts', categoryName: 'Men', sortOrder: 3 },
      { name: 'T-Shirts & Tops', categoryName: 'Women', sortOrder: 1 },
      { name: 'Dresses', categoryName: 'Women', sortOrder: 2 },
      { name: 'Running', categoryName: 'Footwear', sortOrder: 1 },
      { name: 'Casual', categoryName: 'Footwear', sortOrder: 2 },
      { name: 'Bags', categoryName: 'Accessories', sortOrder: 1 },
      { name: 'Smartphones', categoryName: 'Devices', sortOrder: 1 }
    ];

    const createdSubcategories = [];
    for (const subData of subcategoriesData) {
      const parentCategory = createdCategories.find(cat => cat.name === subData.categoryName);
      if (parentCategory) {
        const subcategory = new Subcategory({
          name: subData.name,
          description: `${subData.name} for ${subData.categoryName}`,
          category: parentCategory._id,
          slug: subData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          sortOrder: subData.sortOrder,
          isActive: true
        });
        const saved = await subcategory.save();
        createdSubcategories.push(saved);
      }
    }

    // Create sample brands
    const brandsData = [
      { name: 'Nike', description: 'Just Do It' },
      { name: 'Adidas', description: 'Impossible is Nothing' },
      { name: 'Zara', description: 'Fashion retailer' },
      { name: 'H&M', description: 'Fashion and quality' },
      { name: 'Apple', description: 'Think Different' },
      { name: 'Samsung', description: 'Technology leader' }
    ];

    const createdBrands = [];
    for (const brandData of brandsData) {
      const brand = new Brand({
        name: brandData.name,
        description: brandData.description,
        slug: brandData.name.toLowerCase(),
        sortOrder: createdBrands.length + 1,
        isActive: true
      });
      const saved = await brand.save();
      createdBrands.push(saved);
    }

    // Create sample sizes
    const sizesData = [
      { name: 'XS', code: 'XS', category: 'clothing' },
      { name: 'S', code: 'S', category: 'clothing' },
      { name: 'M', code: 'M', category: 'clothing' },
      { name: 'L', code: 'L', category: 'clothing' },
      { name: 'XL', code: 'XL', category: 'clothing' },
      { name: 'EU 40', code: 'EU40', category: 'footwear' },
      { name: 'EU 41', code: 'EU41', category: 'footwear' },
      { name: 'EU 42', code: 'EU42', category: 'footwear' },
      { name: 'EU 43', code: 'EU43', category: 'footwear' },
      { name: 'One Size', code: 'OS', category: 'accessories' }
    ];

    const createdSizes = [];
    for (const sizeData of sizesData) {
      const size = new Size({
        name: sizeData.name,
        code: sizeData.code,
        category: sizeData.category,
        description: `Size ${sizeData.name}`,
        slug: sizeData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sortOrder: createdSizes.length + 1,
        isActive: true
      });
      const saved = await size.save();
      createdSizes.push(saved);
    }

    // Create sample colors
    const colorsData = [
      { name: 'Black', code: 'BLK', hexCode: '#000000', colorFamily: 'neutral' },
      { name: 'White', code: 'WHT', hexCode: '#FFFFFF', colorFamily: 'neutral' },
      { name: 'Red', code: 'RED', hexCode: '#FF0000', colorFamily: 'red' },
      { name: 'Blue', code: 'BLU', hexCode: '#0000FF', colorFamily: 'blue' },
      { name: 'Green', code: 'GRN', hexCode: '#008000', colorFamily: 'green' },
      { name: 'Gray', code: 'GRY', hexCode: '#808080', colorFamily: 'neutral' },
      { name: 'Navy', code: 'NVY', hexCode: '#000080', colorFamily: 'blue' },
      { name: 'Pink', code: 'PNK', hexCode: '#FFC0CB', colorFamily: 'pink' }
    ];

    const createdColors = [];
    for (const colorData of colorsData) {
      const color = new Color({
        name: colorData.name,
        code: colorData.code,
        hexCode: colorData.hexCode,
        colorFamily: colorData.colorFamily,
        description: `${colorData.name} color`,
        slug: colorData.name.toLowerCase(),
        sortOrder: createdColors.length + 1,
        isActive: true
      });
      const saved = await color.save();
      createdColors.push(saved);
    }

    res.status(200).json({
      success: true,
      message: 'Taxonomy populated successfully!',
      data: {
        categories: createdCategories.length,
        subcategories: createdSubcategories.length,
        brands: createdBrands.length,
        sizes: createdSizes.length,
        colors: createdColors.length
      }
    });

  } catch (error) {
    console.error('Error populating taxonomy:', error);
    res.status(500).json({
      success: false,
      message: 'Error populating taxonomy',
      error: error.message
    });
  }
};

module.exports = {
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
}; 