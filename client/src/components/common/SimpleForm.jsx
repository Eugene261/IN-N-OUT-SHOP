import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Mail, Phone, MapPin, User, Lock, Eye, EyeOff } from 'lucide-react';

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

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const renderFormControl = (controlItem) => {
    const value = formData[controlItem.name] || '';
    const IconComponent = iconMap[controlItem.name];
    const isPasswordField = controlItem.type === 'password';
    const isPasswordVisible = showPassword[controlItem.name];

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
                className={`w-full h-12 ${IconComponent ? 'pl-12' : 'pl-4'} pr-${isPasswordField ? '12' : '4'} rounded-lg border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 text-base`}
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
              <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 focus:border-gray-400">
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
              className="w-full min-h-[80px] p-4 rounded-lg border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 text-base resize-none"
            />
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
        className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg text-base transition-colors"
      >
        {disabled ? 'Processing...' : buttonText}
      </Button>
    </form>
  );
}

export default SimpleForm; 