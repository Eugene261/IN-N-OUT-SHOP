import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { motion } from 'framer-motion';
import { ChevronDown, Store } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllTaxonomyData } from '@/store/superAdmin/taxonomy-slice';

function EnhancedProductFilter({filters, handleFilter, availableShops = []}) {
  const dispatch = useDispatch();
  const { categories, subcategories, brands } = useSelector(state => state.taxonomy);
  const [expandedCategories, setExpandedCategories] = useState(['category']);

  // Fetch taxonomy data on component mount
  useEffect(() => {
    dispatch(fetchAllTaxonomyData());
  }, [dispatch]);

  // Create dynamic filter options using real taxonomy data
  const getDynamicFilterOptions = () => {
    const dynamicOptions = {
      category: categories.map(cat => ({
        id: cat.name.toLowerCase(),
        label: cat.name,
        _id: cat._id
      })),
      brand: brands.map(brand => ({
        id: brand.name.toLowerCase(),
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

    // Add subcategories dynamically based on selected category
    const selectedCategory = filters?.category?.[0];
    if (selectedCategory) {
      const categoryObj = categories.find(cat => cat.name.toLowerCase() === selectedCategory);
      if (categoryObj) {
        const categorySubcategories = subcategories.filter(subcat => {
          const subcatCategoryId = typeof subcat.category === 'object' ? subcat.category._id : subcat.category;
          return subcatCategoryId === categoryObj._id;
        });
        
        if (categorySubcategories.length > 0) {
          dynamicOptions.subCategory = categorySubcategories.map(subcat => ({
            id: subcat.name.toLowerCase(),
            label: subcat.name,
            _id: subcat._id
          }));
        }
      }
    }

    return dynamicOptions;
  };

  const dynamicFilterOptions = getDynamicFilterOptions();

  useEffect(() => {
    if (filters && filters.category && filters.category.length > 0) {
      setExpandedCategories(['category', 'brand', 'shop']);
    }
  }, [filters]);

  const toggleCategory = (category) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(prev => prev.filter(item => item !== category));
    } else {
      if (category === 'category') {
        setExpandedCategories(prev => 
          prev.includes('brand') ? ['category', 'brand', 'shop'] : ['category', 'shop']
        );
      } else {
        setExpandedCategories(prev => [...prev, category]);
      }
    }
  };

  // Simplified isChecked function that works for all filter types
  const isChecked = (filterType, optionId) => {
    return Boolean(
      filters && 
      filters[filterType] && 
      filters[filterType].includes(optionId)
    );
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
        {/* Filter categories including shops */}
        {Object.keys(dynamicFilterOptions)
          .map((keyItem, index) => (
          <motion.div
            key={keyItem}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
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
                            console.log('🎯 Filter clicked:', keyItem, option.id);
                            console.log('📋 Current checked state:', isChecked(keyItem, option.id));
                            
                            // Use the standard handleFilter for all filter types
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
                  {(keyItem === 'category' || keyItem === 'brand') && 
                   dynamicFilterOptions[keyItem]?.length === 0 && (
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