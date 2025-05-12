import { filterOptions } from '@/config';
import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

function ProductFilter({filters, handleFilter}) {
  // Track expanded categories - we'll allow at most two (the current one and possibly 'brand')
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Initialize the component with the selected category from URL if available
  useEffect(() => {
    if (filters && filters.category && filters.category.length > 0) {
      const category = filters.category[0];
      setSelectedCategory(category);
      // Expand the category filter and brand filter by default
      setExpandedCategories(['category', 'brand']);
    }
  }, [filters]);

  // Toggle a category's expanded state
  const toggleCategory = (category) => {
    if (expandedCategories.includes(category)) {
      // If clicking on an already expanded category, collapse it
      setExpandedCategories(prev => prev.filter(item => item !== category));
    } else {
      // If clicking on a collapsed category
      if (category === 'category') {
        // If expanding the category filter, keep brand expanded if it was
        setExpandedCategories(prev => 
          prev.includes('brand') ? ['category', 'brand'] : ['category']
        );
      } else if (category === 'brand') {
        // If expanding the brand filter, keep category expanded if it was
        setExpandedCategories(prev => 
          prev.includes('category') ? ['category', 'brand'] : ['brand']
        );
      } else {
        // For any other filter, collapse all others
        setExpandedCategories([category]);
      }
    }
  };
  
  // When a category is selected, automatically expand the brand filter
  useEffect(() => {
    if (selectedCategory) {
      // Make sure brand filter is expanded when a category is selected
      setExpandedCategories(prev => 
        prev.includes('brand') ? prev : [...prev, 'brand']
      );
    }
  }, [selectedCategory]);

  // Helper function to determine if a checkbox should be checked
  const isChecked = (category, optionId) => {
    // Special case for category to ensure visual state matches actual state
    if (category === 'category' && selectedCategory === optionId) {
      return true;
    }
    
    return Boolean(
      filters && 
      filters[category] && 
      filters[category].includes(optionId)
    );
  };

  // Helper function to get subcategory filter key based on selected category
  const getSubcategoryKey = (category) => {
    return `${category}-subcategory`;
  };
  
  // Helper function to get brand filter key based on selected category
  const getBrandKey = () => {
    if (selectedCategory && filterOptions[`${selectedCategory}-brands`]) {
      return `${selectedCategory}-brands`;
    }
    return 'brand';
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
        {/* Main filter categories */}
        {Object.keys(filterOptions).filter(key => !key.includes('-subcategory') && !key.includes('-brands')).map((keyItem, index) => (
          <motion.div
            key={keyItem}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Fragment>
              <div className="group">
                <div 
                  className="flex justify-between items-center cursor-pointer" 
                  onClick={() => toggleCategory(keyItem)}
                >
                  <h3 className="text-base font-semibold text-black dark:text-white">{keyItem.charAt(0).toUpperCase() + keyItem.slice(1)}</h3>
                  <motion.div
                    animate={{ rotate: expandedCategories.includes(keyItem) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 text-gray-500 group-hover:text-black dark:group-hover:text-white" />
                  </motion.div>
                </div>
                
                {expandedCategories.includes(keyItem) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-2 mt-2 pl-1"
                  >
                    {/* For brand category, use the dynamic brand key based on selected category */}
                    {(keyItem === 'brand' ? filterOptions[getBrandKey()] : filterOptions[keyItem]).map((option, optionIndex) => (
                      <motion.div
                        key={option.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: optionIndex * 0.05 }}
                      >
                        <Label className="flex font-medium items-center gap-2 text-gray-600 dark:text-gray-300 
                        hover:text-black 
                        dark:hover:text-white cursor-pointer group">
                          <Checkbox 
                            checked={isChecked(keyItem, option.id)}
                            onCheckedChange={() => {
                              // Handle checking/unchecking this option
                              if (keyItem === 'category') {
                                // For category, we want to ensure only one is selected at a time
                                const newFilters = {...filters};
                                
                                // If we're checking a category that wasn't checked before
                                if (!isChecked(keyItem, option.id)) {
                                  // Replace any existing category with just this one
                                  newFilters.category = [option.id];
                                  // Set this as the selected category
                                  setSelectedCategory(option.id);
                                  // Clear brand filters when category changes
                                  if (newFilters.brand && newFilters.brand.length > 0) {
                                    delete newFilters.brand;
                                  }
                                } else {
                                  // If we're unchecking the category, clear the category filter
                                  delete newFilters.category;
                                  setSelectedCategory(null);
                                }
                                
                                // Update filters with our modified version
                                // Use handleFilter instead of setFilters which is not defined
                                Object.keys(newFilters).forEach(key => {
                                  if (newFilters[key] && newFilters[key].length > 0) {
                                    handleFilter(key, newFilters[key]);
                                  }
                                });
                                sessionStorage.setItem('filters', JSON.stringify(newFilters));
                              } else {
                                // For non-category filters, use the regular handler
                                handleFilter(keyItem, option.id);
                              }
                            }}
                            className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-black 
                            data-[state=checked]:border-black dark:data-[state=checked]:bg-white 
                            dark:data-[state=checked]:border-white" 
                          />
                          <span className="group-hover:text-black dark:group-hover:text-white transition-colors duration-200">
                            {option.label}
                          </span>
                        </Label>
                        
                        {/* Show subcategories if this category is selected */}
                        {keyItem === 'category' && 
                         isChecked(keyItem, option.id) && 
                         filterOptions[`${option.id}-subcategory`] && (
                          <div className="ml-6 mt-2 border-l-2 border-gray-200 dark:border-gray-700 pl-3 space-y-2">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Subcategories</h4>
                            {filterOptions[`${option.id}-subcategory`].map((subOption) => (
                              <Label 
                                key={subOption.id} 
                                className="flex font-medium items-center gap-2 text-gray-600 dark:text-gray-300 
                                hover:text-black dark:hover:text-white cursor-pointer group"
                              >
                                <Checkbox 
                                  checked={isChecked('subCategory', subOption.id)}
                                  onCheckedChange={() => handleFilter('subCategory', subOption.id)}
                                  className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-black 
                                  data-[state=checked]:border-black dark:data-[state=checked]:bg-white 
                                  dark:data-[state=checked]:border-white h-3.5 w-3.5" 
                                />
                                <span className="text-sm group-hover:text-black dark:group-hover:text-white transition-colors duration-200">
                                  {subOption.label}
                                </span>
                              </Label>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {index < Object.keys(filterOptions).filter(key => !key.includes('-subcategory') && !key.includes('-brands')).length - 1 && (
                <Separator className="my-3 bg-gray-200 dark:bg-gray-800" />
              )}
            </Fragment>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default ProductFilter;