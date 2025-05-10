import { filterOptions } from '@/config';
import React, { useState } from 'react';
import { Fragment } from 'react';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

function ProductFilter({filters, handleFilter}) {
  const [expandedCategories, setExpandedCategories] = useState(Object.keys(filterOptions));

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(item => item !== category) 
        : [...prev, category]
    );
  };

  // Helper function to determine if a checkbox should be checked
  const isChecked = (category, optionId) => {
    return Boolean(
      filters && 
      filters[category] && 
      filters[category].includes(optionId)
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
        {Object.keys(filterOptions).map((keyItem, index) => (
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
                  <h3 className="text-base font-semibold text-black dark:text-white">{keyItem}</h3>
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
                    {filterOptions[keyItem].map((option, optionIndex) => (
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
                            onCheckedChange={() => handleFilter(keyItem, option.id)}
                            className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-black 
                            data-[state=checked]:border-black dark:data-[state=checked]:bg-white 
                            dark:data-[state=checked]:border-white" 
                          />
                          <span className="group-hover:text-black dark:group-hover:text-white transition-colors duration-200">
                            {option.label}
                          </span>
                        </Label>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {index < Object.keys(filterOptions).length - 1 && (
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