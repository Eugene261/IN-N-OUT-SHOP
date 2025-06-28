import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import MultiSelect from './MultiSelect';
import RichTextEditor from './RichTextEditor';
import { AlertCircle, Info, Check, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

function CommonForm({ 
  formControls, 
  formData, 
  setFormData, 
  onSubmit, 
  buttonText, 
  disabled,
  buttonDisabled,
  isAuthForm = false 
}) {
  // State for validation errors
  const [errors, setErrors] = useState({});
  
  // Validate a single field
  const validateField = (name, value, validation) => {
    if (!validation) return null;
    
    // Check required
    if (validation.required && (!value || value.length === 0)) {
      return validation.required;
    }
    
    // Check minLength
    if (validation.minLength && value.length < validation.minLength.value) {
      return validation.minLength.message;
    }
    
    // Check pattern
    if (validation.pattern && !validation.pattern.value.test(value)) {
      return validation.pattern.message;
    }
    
    return null;
  };
  
  // Handle input change with validation
  const handleInputChange = (name, value, validation) => {
    // Update form data
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validate if rules exist
    if (validation) {
      const error = validateField(name, value, validation);
      
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };
  
  // Validate all fields before submission
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    formControls.forEach(control => {
      if (control.validation) {
        const error = validateField(
          control.name, 
          formData[control.name] || '', 
          control.validation
        );
        
        if (error) {
          newErrors[control.name] = error;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Override the original onSubmit to include validation
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(e);
    }
  };
  
  const renderInputsByComponentType = (controlItem) => {
    let element = null;
    const value = formData[controlItem.name] || '';
    
    const error = errors[controlItem.name];
    
    // Check if this is a dynamic field that should be hidden based on category
    if (controlItem.dynamicField && controlItem.categories) {
      const currentCategory = formData.category;
      if (!currentCategory || !controlItem.categories.includes(currentCategory)) {
        return null; // Don't render this field for the current category
      }
    }
    
    const commonProps = {
      name: controlItem.name,
      placeholder: controlItem.placeholder,
      id: controlItem.name,
      value: value,
      disabled: disabled,
      className: `bg-white border-${error ? 'red-500' : 'gray-300'} rounded-lg focus:border-${error ? 'red-500' : 'black'} focus:ring-2 focus:ring-${error ? 'red-200' : 'gray-400'}`
    };

    switch (controlItem.componentType) {
      case 'input':
        element = (
          <div className="space-y-1">
            <Input
              {...commonProps}
              type={controlItem.type}
              step={controlItem.step}
              min={controlItem.min}
              max={controlItem.max}
              onChange={(e) => handleInputChange(
                controlItem.name,
                e.target.value,
                controlItem.validation
              )}
              aria-invalid={error ? 'true' : 'false'}
            />
            {error && (
              <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
            {!error && controlItem.helpText && (
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Info className="h-3 w-3" />
                <span>{controlItem.helpText}</span>
              </div>
            )}
          </div>
        );
        break;
      
      case 'select':
        // Filter options for dynamic fields like subcategory and brand
        let selectOptions = controlItem.options || [];
        
        // DEBUG: Log select options
        console.log(`🔍 Select field: ${controlItem.name}`);
        console.log('All options:', controlItem.options);
        console.log('Current category:', formData.category);
        console.log('Dynamic options?', controlItem.dynamicOptions);
        
        if (controlItem.dynamicOptions && formData.category) {
          if (controlItem.name === 'subCategory') {
            // Filter subcategory options based on the selected category
            selectOptions = controlItem.options.filter(option => 
              option.categories && option.categories.includes(formData.category)
            );
            console.log('Filtered subcategory options:', selectOptions);
          } else if (controlItem.name === 'brand') {
            // Filter brand options based on the selected category
            selectOptions = controlItem.options.filter(option => 
              option.categories && option.categories.includes(formData.category)
            );
            console.log('Filtered brand options:', selectOptions);
          }
        } else {
          console.log('Using all options (no filtering):', selectOptions);
        }
        
        element = (
          <div id={`${controlItem.name}-field`}>
            <Select 
              value={value || ""}
              onValueChange={(newValue) => {
                if (newValue && newValue !== value) {
                  // Handle category change - reset subcategory if category changes
                  if (controlItem.name === 'category') {
                    setFormData(prev => ({
                      ...prev,
                      [controlItem.name]: newValue,
                      subCategory: '', // Reset subcategory when category changes
                      // Auto-set gender to unisex for devices if not already set
                      ...(newValue === 'devices' && !prev.gender ? { gender: 'unisex' } : {})
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      [controlItem.name]: newValue
                    }));
                  }
                }
              }}
              disabled={disabled || (controlItem.name === 'subCategory' && !formData.category)}
            >
              <SelectTrigger className="w-full bg-white border-gray-300 rounded-lg hover:border-gray-400">
                <SelectValue placeholder={`Select ${controlItem.label}`} />
              </SelectTrigger>
              <SelectContent 
                position="popper" 
                className="z-[9999] bg-white border-gray-300"
                sideOffset={5}
              >
                {selectOptions
                  .filter(optionItem => optionItem.id && optionItem.id.trim() !== '')
                  .map(optionItem => (
                  <SelectItem 
                    key={`${optionItem.id}-${optionItem.categories ? optionItem.categories.join('-') : ''}`} 
                    value={optionItem.id}
                    className="hover:bg-gray-100 focus:bg-gray-100"
                  >
                    {optionItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );
        break;

      case 'multiselect':
        // Filter options based on selected category if this is a dynamic field
        let filteredOptions = controlItem.options || [];
        let isRequired = controlItem.required || false;
        
        // DEBUG: Log multiselect options
        console.log(`🔍 Multiselect field: ${controlItem.name}`);
        console.log('All options:', controlItem.options);
        console.log('Current category:', formData.category);
        console.log('Dynamic options?', controlItem.dynamicOptions);
        
        if (controlItem.dynamicOptions && controlItem.name === 'sizes') {
          // Determine if sizes are required based on category
          if (formData.category === 'men' || formData.category === 'women' || formData.category === 'kids' || formData.category === 'footwear' || formData.category === 'trousers') {
            isRequired = true;
          } else {
            isRequired = false;
          }
          
          // Handle trousers category or trouser-like products
          const isTrousers = formData.category === 'trousers' || 
                           formData.title?.toLowerCase().includes('trouser') || 
                           formData.title?.toLowerCase().includes('pant') || 
                           formData.description?.toLowerCase().includes('trouser') || 
                           formData.description?.toLowerCase().includes('pant');
          
          if (isTrousers) {
            // For trousers category, show waist sizes based on gender
            // Default to showing both men's and women's sizes if no gender specified
            const gender = formData.gender || (formData.category === 'men' ? 'men' : formData.category === 'women' ? 'women' : null);
            
            if (gender) {
              // Filter to show only trouser waist sizes for the specific gender
              filteredOptions = controlItem.options.filter(option => 
                option.subCategory === 'trousers' && option.categories.includes(gender)
              );
            } else {
              // If no gender specified, show all trouser sizes
              filteredOptions = controlItem.options.filter(option => 
                option.subCategory === 'trousers'
              );
            }
          } else if (formData.category === 'footwear') {
            // For footwear, show shoe sizes
            filteredOptions = controlItem.options.filter(option => 
              option.categories && option.categories.includes('footwear')
            );
          } else if (formData.category) {
            // For other categories, filter size options based on the selected category
            filteredOptions = controlItem.options.filter(option => 
              option.categories && option.categories.includes(formData.category) && 
              (!option.subCategory || option.subCategory !== 'trousers')
            );
          }
        }
        
        console.log('Final filtered options for', controlItem.name, ':', filteredOptions);
        
        element = (
          <div className="space-y-1">
            {/* Only show the label if it's not already shown by the form field */}
            {!controlItem.skipLabel && (
              <div className="flex items-center justify-between">
                <Label htmlFor={controlItem.name} className="text-sm font-medium text-gray-700">
                  {controlItem.label}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {controlItem.name === 'sizes' && !isRequired && (
                  <span className="text-xs text-gray-500">
                    {formData.category === 'devices' ? 'Not applicable for devices' : 'Optional'}
                  </span>
                )}
              </div>
            )}
            <MultiSelect
              name={controlItem.name}
              options={filteredOptions}
              value={formData[controlItem.name] || []}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  [controlItem.name]: e.target.value
                });
              }}
              placeholder={controlItem.placeholder || `Select ${controlItem.label}`}
              disabled={disabled}
              className="bg-white border-gray-300 rounded-lg focus:border-black"
            />
            {error && (
              <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );
        break;
        
      case 'textarea':
        // Use the rich text editor for description field, regular textarea for others
        if (controlItem.name === 'description') {
          element = (
            <div className="space-y-1">
              <RichTextEditor
                value={value}
                onChange={(newValue) => handleInputChange(
                  controlItem.name,
                  newValue,
                  controlItem.validation
                )}
                error={error}
                helpText={controlItem.helpText}
                placeholder={controlItem.placeholder}
                disabled={disabled}
              />
            </div>
          );
        } else {
          element = (
            <div className="space-y-1">
              <Textarea
                {...commonProps}
                onChange={(e) => handleInputChange(
                  controlItem.name,
                  e.target.value,
                  controlItem.validation
                )}
                aria-invalid={error ? 'true' : 'false'}
              />
              {error && (
                <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          );
        }
        break;
        
      default:
        element = <Input {...commonProps} type={controlItem.type} />;
        break;
    }

    return element;
  };

  // Password visibility toggle for password fields
  const [passwordVisibility, setPasswordVisibility] = useState({});
  
  const togglePasswordVisibility = (fieldName) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };
  
  // Animation variants for form elements
  const formVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };
  
  // Custom rendering for password fields with visibility toggle and requirements
  const renderPasswordField = (controlItem, commonProps, error) => {
    const isVisible = passwordVisibility[controlItem.name] || false;
    const currentValue = formData[controlItem.name] || '';
    
    // Check password requirements if they exist
    const checkRequirement = (requirement) => {
      return requirement.regex.test(currentValue);
    };
    
    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            {...commonProps}
            type={isVisible ? 'text' : 'password'}
            onChange={(e) => handleInputChange(
              controlItem.name,
              e.target.value,
              controlItem.validation
            )}
            aria-invalid={error ? 'true' : 'false'}
            className={`${commonProps.className} pr-10`}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => togglePasswordVisibility(controlItem.name)}
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Password Requirements */}
        {controlItem.showPasswordRequirements && controlItem.passwordRequirements && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
            <div className="space-y-1">
              {controlItem.passwordRequirements.map((requirement) => {
                const isValid = checkRequirement(requirement);
                return (
                  <div key={requirement.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isValid ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {isValid && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={isValid ? 'text-green-600' : 'text-gray-600'}>
                      {requirement.text}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Password Strength Indicator */}
            {currentValue && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Strength:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        controlItem.passwordRequirements.filter(req => checkRequirement(req)).length < 2 
                          ? 'bg-red-500 w-1/4' 
                          : controlItem.passwordRequirements.filter(req => checkRequirement(req)).length < 4
                          ? 'bg-yellow-500 w-2/4'
                          : controlItem.passwordRequirements.filter(req => checkRequirement(req)).length < 5
                          ? 'bg-blue-500 w-3/4'
                          : 'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    controlItem.passwordRequirements.filter(req => checkRequirement(req)).length < 2 
                      ? 'text-red-500' 
                      : controlItem.passwordRequirements.filter(req => checkRequirement(req)).length < 4
                      ? 'text-yellow-500'
                      : controlItem.passwordRequirements.filter(req => checkRequirement(req)).length < 5
                      ? 'text-blue-500'
                      : 'text-green-500'
                  }`}>
                    {controlItem.passwordRequirements.filter(req => checkRequirement(req)).length < 2 
                      ? 'Weak' 
                      : controlItem.passwordRequirements.filter(req => checkRequirement(req)).length < 4
                      ? 'Fair'
                      : controlItem.passwordRequirements.filter(req => checkRequirement(req)).length < 5
                      ? 'Good'
                      : 'Strong'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Help text for non-password-requirement fields */}
        {controlItem.helpText && !controlItem.showPasswordRequirements && (
          <p className="text-xs text-gray-500 mt-1">{controlItem.helpText}</p>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      className={`w-full ${isAuthForm ? 'max-w-md mx-auto' : 'max-w-none'}`}
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${
        isAuthForm 
          ? 'p-6 sm:p-8 shadow-lg' 
          : 'p-4 sm:p-6 lg:p-8'
      }`}>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className={`${
            isAuthForm 
              ? 'space-y-4 sm:space-y-6' 
              : 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'
          }`}>
            {formControls.map((controlItem) => (
              <motion.div 
                key={controlItem.name} 
                className={`${
                  isAuthForm 
                    ? 'space-y-2' 
                    : `${
                        controlItem.componentType === 'textarea' || 
                        controlItem.name === 'description' ||
                        controlItem.name === 'address' ||
                        controlItem.name === 'notes' ||
                        controlItem.name === 'title' ||
                        controlItem.className === 'lg:col-span-2'
                          ? 'lg:col-span-2' 
                          : ''
                      } space-y-2`
                } `}
                variants={itemVariants}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor={controlItem.name}
                      className={`text-sm font-medium ${errors[controlItem.name] ? 'text-red-500' : 'text-gray-700'}`}
                    >
                      {controlItem.label}
                      {/* Make gender optional for devices */}
                      {controlItem.required && !(controlItem.name === 'gender' && formData.category === 'devices') && <span className="text-red-500 ml-1">*</span>}
                      {controlItem.name === 'gender' && formData.category === 'devices' && <span className="text-xs text-gray-500 ml-2">(Optional for devices)</span>}
                    </Label>
                    
                    {!errors[controlItem.name] && formData[controlItem.name] && formData[controlItem.name].length > 0 && (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Valid
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="w-full">
                  {controlItem.type === 'password' 
                    ? renderPasswordField(
                        controlItem, 
                        {
                          name: controlItem.name,
                          placeholder: controlItem.placeholder,
                          id: controlItem.name,
                          value: formData[controlItem.name] !== undefined ? formData[controlItem.name] : '',
                          disabled: disabled,
                          className: `w-full bg-white border-${errors[controlItem.name] ? 'red-500' : 'gray-300'} rounded-lg focus:border-${errors[controlItem.name] ? 'red-500' : 'black'} focus:ring-2 focus:ring-${errors[controlItem.name] ? 'red-200' : 'gray-400'}`
                        }, 
                        errors[controlItem.name]
                      )
                    : renderInputsByComponentType(controlItem)
                  }
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="pt-4"
          >
            <Button 
              type="submit" 
              className={`${
                isAuthForm 
                  ? 'w-full' 
                  : 'w-full sm:w-auto'
              } px-8 py-3 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300`}
              disabled={disabled || buttonDisabled}
            >
              {buttonText}
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}

export default CommonForm;
