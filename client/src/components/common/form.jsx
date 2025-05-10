import React from 'react'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import MultiSelect from './MultiSelect'
import { useEffect, useState } from 'react'

function CommonForm({ 
  formControls, 
  formData, 
  setFormData, 
  onSubmit, 
  buttonText, 
  disabled,
  buttonDisabled 
 }) {
  const renderInputsByComponentType = (controlItem) => {
    const value = formData[controlItem.name] !== undefined ? formData[controlItem.name] : 
                  (controlItem.componentType === 'multiselect' ? [] : '');

    const commonProps = {
      name: controlItem.name,
      placeholder: controlItem.placeholder,
      id: controlItem.name,
      value: value,
      disabled: disabled,
      className: 'bg-white border-gray-300 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-400'
    }

    switch (controlItem.componentType) {
      case 'input':
        return (
          <Input
            {...commonProps}
            type={controlItem.type}
            onChange={(e) => setFormData({
              ...formData,
              [controlItem.name]: e.target.value
            })}
          />
        )
      
      case 'select':
        return (
          <div id={`${controlItem.name}-field`}>
            <Select 
              value={value || ""}
              onValueChange={(newValue) => {
                if (newValue && newValue !== value) {
                  setFormData(prev => ({
                    ...prev,
                    [controlItem.name]: newValue
                  }));
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-full bg-white border-gray-300 rounded-lg hover:border-gray-400">
                <SelectValue placeholder={`Select ${controlItem.label}`} />
              </SelectTrigger>
              <SelectContent 
                position="popper" 
                className="z-[9999] bg-white border-gray-300"
                sideOffset={5}
              >
                {controlItem.options?.map(optionItem => (
                  <SelectItem 
                    key={optionItem.id} 
                    value={optionItem.id}
                    className="hover:bg-gray-100 focus:bg-gray-100"
                  >
                    {optionItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'multiselect':
        // Filter options based on selected category if this is a dynamic field
        let filteredOptions = controlItem.options || [];
        
        if (controlItem.dynamicOptions && controlItem.name === 'sizes' && formData.category) {
          // Filter size options based on the selected category
          filteredOptions = controlItem.options.filter(option => 
            option.categories && option.categories.includes(formData.category)
          );
        }
        
        return (
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
        )

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={4}
            onChange={(e) => setFormData({
              ...formData,
              [controlItem.name]: e.target.value
            })}
          />
        )
      
      default:
        return <Input {...commonProps} type={controlItem.type} />
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-6">
            {formControls.map((controlItem) => (
              <div key={controlItem.name} className="grid w-full">
                <div className="relative mb-2">
                  <div className="absolute left-0 top-1/2 w-2 h-2 bg-gray-800 rounded-full -translate-y-1/2" />
                  <div className="absolute left-0 top-1/2 w-full h-px bg-gray-200 -translate-y-1/2" />
                  
                  <div className="flex items-center pl-4 relative z-10">
                    <Label 
                      htmlFor={controlItem.name} 
                      className="text-sm uppercase tracking-wider font-medium text-gray-800 px-2 py-1"
                    >
                      {controlItem.label}
                      {controlItem.required && (
                        <span className="ml-1 text-gray-500">*</span>
                      )}
                    </Label>
                  </div>
                </div>
                
                <div className="relative">
                  {renderInputsByComponentType(controlItem)}
                  
                  {controlItem.description && (
                    <p className="text-xs text-gray-500 mt-1.5 ml-4 italic">
                      {controlItem.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <Button 
              type="submit" 
              className="w-full py-6 text-base font-medium shadow-sm 
              bg-gray-900 text-white hover:bg-gray-800 
              disabled:opacity-50 disabled:cursor-not-allowed 
              transition-colors duration-200 cursor-pointer"
              disabled={buttonDisabled}
            >
              {buttonText || "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CommonForm