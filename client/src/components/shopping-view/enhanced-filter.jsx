import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Store } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllTaxonomyData } from '@/store/superAdmin/taxonomy-slice';

function EnhancedProductFilter({filters, handleFilter, availableShops = []}) {
  const dispatch = useDispatch();
  const { categories, subcategories, brands } = useSelector(state => state.taxonomy);
  const [expandedCategories, setExpandedCategories] = useState(['category']);
  const [expandedSubcategories, setExpandedSubcategories] = useState({});

  // Fetch taxonomy data on component mount
  useEffect(() => {
    dispatch(fetchAllTaxonomyData());
  }, [dispatch]);

  // Auto-expand subcategories when a category is selected
  useEffect(() => {
    if (filters?.category && filters.category.length > 0) {
      const selectedCategory = filters.category[0];
      const categorySubcategories = getSubcategoriesForCategory(selectedCategory);
      
      if (categorySubcategories.length > 0) {
        // Auto-expand subcategories for the selected category
        setExpandedSubcategories(prev => ({
          ...prev,
          [selectedCategory]: true
        }));
      }
    } else {
      // Collapse all subcategories when no category is selected
      setExpandedSubcategories({});
    }
  }, [filters?.category, categories, subcategories]);

  // Get subcategories for a specific category
  const getSubcategoriesForCategory = (categoryName) => {
    const categoryObj = categories.find(cat => cat.name === categoryName);
    if (!categoryObj) return [];
    
    return subcategories.filter(subcat => {
      const subcatCategoryId = typeof subcat.category === 'object' ? subcat.category._id : subcat.category;
      return subcatCategoryId === categoryObj._id;
    });
  };

  // Toggle subcategory dropdown for a specific category
  const toggleSubcategoryDropdown = (categoryName) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Create dynamic filter options using real taxonomy data
  const getDynamicFilterOptions = () => {
    console.log('🔍 Enhanced Filter Debug:');
    console.log('Categories loaded:', categories.length, categories.map(c => c.name));
    console.log('Brands loaded:', brands.length, brands.map(b => b.name));
    console.log('Current filters:', filters);
    
    const dynamicOptions = {
      brand: brands.map(brand => ({
        id: brand.name,
        label: brand.name,
        _id: brand._id
      })),
      shop: availableShops.map(shop => ({
        id: shop.shopName,
        label: `${shop.shopName} (${shop.productCount})`,
        category: shop.shopCategory
      })),
      price: [
        { id: "0-50", label: "Under GHS 50" },
        { id: "50-100", label: "GHS 50 - GHS 100" },
        { id: "100-200", label: "GHS 100 - GHS 200" },
        { id: "200-500", label: "GHS 200 - GHS 500" },
        { id: "500-1000", label: "GHS 500 - GHS 1000" },
        { id: "1000+", label: "Above GHS 1000" },
      ]
    };

    console.log('Final dynamic options:', dynamicOptions);
    return dynamicOptions;
  };

  const dynamicFilterOptions = getDynamicFilterOptions();

  const toggleCategory = (category) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(prev => prev.filter(item => item !== category));
    } else {
      setExpandedCategories(prev => [...prev, category]);
    }
  };

  const isChecked = (keyItem, optionId) => {
    return Boolean(
      filters && 
      filters[keyItem] && 
      filters[keyItem].includes(optionId)
    );
  };

  const isCategorySelected = (categoryName) => {
    return Boolean(filters?.category?.includes(categoryName));
  };

  const isSubcategorySelected = (subcategoryName) => {
    return Boolean(filters?.subCategory?.includes(subcategoryName));
  };

  return (
    <motion.div 
      className="bg-white dark:bg-black rounded-lg shadow-md border border-gray-200 dark:border-gray-800"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold text-black dark:text-white">Filters</h2>
      </div>
      <div className="p-4 space-y-4">
        
        {/* Categories with Subcategory Dropdowns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">Categories</h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleCategory('category')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <ChevronDown 
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  expandedCategories.includes('category') ? 'rotate-180' : ''
                }`} 
              />
            </motion.button>
          </div>

          {expandedCategories.includes('category') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 space-y-1"
            >
              {categories.map((category, categoryIndex) => {
                const categorySubcategories = getSubcategoriesForCategory(category.name);
                const hasSubcategories = categorySubcategories.length > 0;
                const isSelected = isCategorySelected(category.name);
                const isSubcategoryExpanded = expandedSubcategories[category.name];

                return (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: categoryIndex * 0.05 }}
                    className="space-y-1"
                  >
                    {/* Main Category */}
                    <div className="flex items-center justify-between group">
                      <Label className="flex font-medium items-center gap-2 text-gray-600 dark:text-gray-300 
                      hover:text-black dark:hover:text-white cursor-pointer group flex-1">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => handleFilter('category', category.name)}
                          className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-black 
                          data-[state=checked]:border-black dark:data-[state=checked]:bg-white 
                          dark:data-[state=checked]:border-white" 
                        />
                        <span className="group-hover:text-black dark:group-hover:text-white transition-colors duration-200 text-sm">
                          {category.name}
                        </span>
                      </Label>
                      
                                             {/* Subcategory Toggle Button */}
                       {hasSubcategories && isSelected && (
                         <motion.button
                           whileHover={{ scale: 1.1 }}
                           whileTap={{ scale: 0.9 }}
                           onClick={() => toggleSubcategoryDropdown(category.name)}
                           className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ml-2"
                         >
                           <ChevronRight 
                             className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                               isSubcategoryExpanded ? 'rotate-90' : ''
                             }`} 
                           />
                         </motion.button>
                       )}
                    </div>

                    {/* Subcategories Dropdown */}
                    <AnimatePresence>
                      {hasSubcategories && isSelected && isSubcategoryExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-6 pl-2 border-l border-gray-200 dark:border-gray-700 space-y-1"
                        >
                          {categorySubcategories.map((subcategory, subIndex) => (
                            <motion.div
                              key={subcategory._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: subIndex * 0.03 }}
                            >
                              <Label className="flex font-medium items-center gap-2 text-gray-500 dark:text-gray-400 
                              hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer group">
                                <Checkbox 
                                  checked={isSubcategorySelected(subcategory.name)}
                                  onCheckedChange={() => handleFilter('subCategory', subcategory.name)}
                                  className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-gray-700 
                                  data-[state=checked]:border-gray-700 dark:data-[state=checked]:bg-gray-300 
                                  dark:data-[state=checked]:border-gray-300" 
                                />
                                <span className="group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200 text-xs">
                                  {subcategory.name}
                                </span>
                              </Label>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
              
              {/* Show loading state while taxonomy data is being fetched */}
              {categories.length === 0 && (
                <div className="text-sm text-gray-500 italic">
                  Loading categories...
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <Separator className="my-3 bg-gray-200 dark:bg-gray-800" />

        {/* Other Filter Categories */}
        {Object.keys(dynamicFilterOptions).map((keyItem, index) => (
          <motion.div
            key={keyItem}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (index + 1) * 0.1 }}
          >
            <Fragment>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                  {keyItem === 'subCategory' ? 'Subcategories' : keyItem}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleCategory(keyItem)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      expandedCategories.includes(keyItem) ? 'rotate-180' : ''
                    }`} 
                  />
                </motion.button>
              </div>

              {expandedCategories.includes(keyItem) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-2 mt-2 pl-1 max-h-48 overflow-y-auto"
                >
                  {dynamicFilterOptions[keyItem]?.map((option, optionIndex) => (
                    <motion.div
                      key={option.id || option.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: optionIndex * 0.05 }}
                    >
                      <Label className="flex font-medium items-center gap-2 text-gray-600 dark:text-gray-300 
                      hover:text-black dark:hover:text-white cursor-pointer group">
                        <Checkbox 
                          checked={isChecked(keyItem, option.id)}
                          onCheckedChange={() => {
                            handleFilter(keyItem, option.id);
                          }}
                          className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-black 
                          data-[state=checked]:border-black dark:data-[state=checked]:bg-white 
                          dark:data-[state=checked]:border-white" 
                        />
                        <span className="group-hover:text-black dark:group-hover:text-white transition-colors duration-200 text-sm">
                          {keyItem === 'shop' && <Store className="w-3 h-3 mr-1" />}
                          {option.label}
                        </span>
                      </Label>
                    </motion.div>
                  ))}
                  
                  {/* Show loading state while taxonomy data is being fetched */}
                  {keyItem === 'brand' && dynamicFilterOptions[keyItem]?.length === 0 && (
                    <div className="text-sm text-gray-500 italic">
                      Loading {keyItem}...
                    </div>
                  )}
                </motion.div>
              )}
            </Fragment>

            {index < Object.keys(dynamicFilterOptions).length - 1 && (
              <Separator className="my-3 bg-gray-200 dark:bg-gray-800" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default EnhancedProductFilter; 