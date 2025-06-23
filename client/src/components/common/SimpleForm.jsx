import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Mail, Phone, MapPin, User, Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

const iconMap = {
  email: Mail,
  phone: Phone,
  address: MapPin,
  region: MapPin,
  city: MapPin,
  customerName: User,
  userName: User,
  password: Lock,
  notes: MapPin
};

function SimpleForm({ 
  formControls, 
  formData, 
  setFormData, 
  onSubmit, 
  buttonText = "Submit",
  disabled = false,
  buttonDisabled = false,
  isAuthForm = false
}) {
  const [showPassword, setShowPassword] = useState({});
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

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });

    // Validate field if it has validation rules
    const control = formControls.find(c => c.name === name);
    if (control && control.validation) {
      const error = validateField(name, value, control.validation);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(e);
    }
  };

  const renderFormControl = (controlItem) => {
    const value = formData[controlItem.name] || '';
    const IconComponent = iconMap[controlItem.name];
    const isPasswordField = controlItem.type === 'password';
    const isPasswordVisible = showPassword[controlItem.name];
    const error = errors[controlItem.name];

    // Password requirements for validation
    const passwordRequirements = [
      { 
        id: 'length', 
        text: 'At least 8 characters', 
        regex: /.{8,}/ 
      },
      { 
        id: 'uppercase', 
        text: 'One uppercase letter', 
        regex: /[A-Z]/ 
      },
      { 
        id: 'lowercase', 
        text: 'One lowercase letter', 
        regex: /[a-z]/ 
      },
      { 
        id: 'number', 
        text: 'One number', 
        regex: /\d/ 
      },
      { 
        id: 'special', 
        text: 'One special character (@$!%*?&)', 
        regex: /[@$!%*?&]/ 
      }
    ];

    const checkRequirement = (requirement) => {
      return requirement.regex.test(value);
    };

    switch (controlItem.componentType) {
      case 'input':
        return (
          <div key={controlItem.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              {controlItem.label}
            </label>
            <div className="relative">
              {IconComponent && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <IconComponent size={20} />
                </div>
              )}
              <Input
                type={isPasswordField && isPasswordVisible ? 'text' : controlItem.type}
                name={controlItem.name}
                placeholder={controlItem.placeholder}
                value={value}
                onChange={(e) => handleInputChange(controlItem.name, e.target.value)}
                disabled={disabled}
                className={`w-full h-12 ${IconComponent ? 'pl-12' : 'pl-4'} pr-${isPasswordField ? '12' : '4'} rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} focus:border-gray-400 focus:ring-2 focus:ring-gray-200 text-base`}
              />
              {isPasswordField && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => togglePasswordVisibility(controlItem.name)}
                >
                  {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
            
            {/* Error message */}
            {error && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}

            {/* Password Requirements - only show for password fields and when user starts typing */}
            {isPasswordField && value && controlItem.name === 'password' && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((requirement) => {
                    const isValid = checkRequirement(requirement);
                    return (
                      <div key={requirement.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isValid ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {isValid && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={isValid ? 'text-green-600' : 'text-gray-600'}>
                          {requirement.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Password Strength Indicator */}
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Strength:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordRequirements.filter(req => checkRequirement(req)).length < 2 
                            ? 'bg-red-500 w-1/4' 
                            : passwordRequirements.filter(req => checkRequirement(req)).length < 4
                            ? 'bg-yellow-500 w-2/4'
                            : passwordRequirements.filter(req => checkRequirement(req)).length < 5
                            ? 'bg-blue-500 w-3/4'
                            : 'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${
                      passwordRequirements.filter(req => checkRequirement(req)).length < 2 
                        ? 'text-red-500' 
                        : passwordRequirements.filter(req => checkRequirement(req)).length < 4
                        ? 'text-yellow-500'
                        : passwordRequirements.filter(req => checkRequirement(req)).length < 5
                        ? 'text-blue-500'
                        : 'text-green-500'
                    }`}>
                      {passwordRequirements.filter(req => checkRequirement(req)).length < 2 
                        ? 'Weak' 
                        : passwordRequirements.filter(req => checkRequirement(req)).length < 4
                        ? 'Fair'
                        : passwordRequirements.filter(req => checkRequirement(req)).length < 5
                        ? 'Good'
                        : 'Strong'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={controlItem.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              {controlItem.label}
            </label>
            <Select 
              value={value || ""}
              onValueChange={(newValue) => handleInputChange(controlItem.name, newValue)}
              disabled={disabled}
            >
              <SelectTrigger className={`w-full h-12 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} focus:border-gray-400`}>
                <SelectValue placeholder={controlItem.placeholder} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300">
                {controlItem.options?.map(optionItem => (
                  <SelectItem key={optionItem.id} value={optionItem.id}>
                    {optionItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={controlItem.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              {controlItem.label}
            </label>
            <Textarea
              name={controlItem.name}
              placeholder={controlItem.placeholder}
              value={value}
              onChange={(e) => handleInputChange(controlItem.name, e.target.value)}
              disabled={disabled}
              className={`w-full min-h-[80px] p-4 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} focus:border-gray-400 focus:ring-2 focus:ring-gray-200 text-base resize-none`}
            />
            {error && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formControls.map(renderFormControl)}
      
      <Button
        type="submit"
        disabled={disabled || buttonDisabled}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-base transition-colors"
      >
        {disabled ? 'Processing...' : buttonText}
      </Button>
    </form>
  );
}

export default SimpleForm; 