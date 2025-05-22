import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { ChevronDown, ChevronUp, Edit, Trash2, MapPin, Phone, Mail, Home, Info } from 'lucide-react';
import CommonForm from '../common/form';
import { addressFormControls } from '@/config';
import { motion, AnimatePresence } from 'framer-motion';

const AccordionAddressCard = ({ 
  addressInfo, 
  handleEditAddress, 
  handleDeleteAddress,
  setCurrentSelectedAddress,
  selectedId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    customerName: addressInfo?.customerName || '', // Add customer name field
    region: addressInfo?.region || '',
    address: addressInfo?.address || '',
    city: addressInfo?.city || '',
    phone: addressInfo?.phone || '',
    notes: addressInfo?.notes || '',
  });
  const [errors, setErrors] = useState({});

  const toggleAccordion = () => {
    if (!isEditing) {
      setIsOpen(!isOpen);
    }
  };

  const startEditing = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    // Make sure accordion is open when editing
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const cancelEditing = (e) => {
    e?.stopPropagation();
    setIsEditing(false);
    // Reset form data to original values
    setFormData({
      customerName: addressInfo?.customerName || '', // Include customer name when resetting
      region: addressInfo?.region || '',
      address: addressInfo?.address || '',
      city: addressInfo?.city || '',
      phone: addressInfo?.phone || '',
      notes: addressInfo?.notes || '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = addressFormControls.filter(control => control.required);
    
    requiredFields.forEach(control => {
      const value = formData[control.name]?.toString().trim();
      if (!value) {
        newErrors[control.name] = `${control.label} is required`;
      }
    });

    // Add specific validation for phone number
    if (formData.phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Invalid phone number format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return addressFormControls.every(control => {
      if (!control.required) return true;
      const value = formData[control.name]?.toString().trim();
      return !!value;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Call the parent component's edit handler with the addressId and updated data
    handleEditAddress({
      addressId: addressInfo._id,
      formData: formData
    });
    
    // Exit edit mode
    setIsEditing(false);
  };

  // Display a preview of the address when collapsed
  const addressPreview = `${addressInfo.address}, ${addressInfo.city}`;

  console.log(selectedId, addressInfo?._id);
  

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card 
        onClick={setCurrentSelectedAddress ? () => setCurrentSelectedAddress(addressInfo) : null}
        className={`mb-4 overflow-hidden cursor-pointer transition-all duration-300 ${
          selectedId?._id === addressInfo?._id 
            ? 'border-2 border-indigo-600 shadow-lg shadow-indigo-100' 
            : 'border border-gray-200 shadow-sm hover:shadow-md'
        }`}
      >
        {/* Accordion Header - Always visible */}
        <div 
          className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${
            selectedId?._id === addressInfo?._id 
              ? 'bg-indigo-50' 
              : 'bg-white hover:bg-gray-50'
          }`}
          onClick={toggleAccordion}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${selectedId?._id === addressInfo?._id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
              <MapPin size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 truncate">{addressPreview}</span>
              <span className="text-sm text-gray-500">{addressInfo.region}</span>
            </div>
          </div>
          <div className={`${selectedId?._id === addressInfo?._id ? 'text-indigo-600' : 'text-gray-500'}`}>
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {/* Accordion Content - Visible when open */}
        {isOpen && (
          <>
            {isEditing ? (
              <CardContent className={`${selectedId === addressInfo?._id ? 'border-black': ''} pt-4 pb-2 border-t border-gray-100`}>
                <CommonForm 
                  formControls={addressFormControls}
                  formData={formData}
                  setFormData={setFormData}
                  buttonText="Update Address"
                  onSubmit={handleSubmit}
                  buttonDisabled={!isFormValid()}
                  errors={errors}
                />
                <button
                  onClick={cancelEditing}
                  className="w-full mt-2 px-4 py-2 text-sm font-medium rounded-md bg-gray-100 
                          text-gray-700 hover:bg-gray-200 transition-colors duration-200 
                          focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </CardContent>
            ) : (
              <>
                <CardContent className="pt-5 pb-3 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                          <Home size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Region</span>
                          <span className="text-gray-900 font-medium">{addressInfo.region}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                          <MapPin size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Address</span>
                          <span className="text-gray-900 font-medium">{addressInfo.address}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                          <Mail size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">City</span>
                          <span className="text-gray-900 font-medium">{addressInfo.city}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                          <Phone size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</span>
                          <span className="text-gray-900 font-medium">{addressInfo.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    {addressInfo.notes && (
                      <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors md:col-span-2">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                            <Info size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Notes</span>
                            <span className="text-gray-900 font-medium">{addressInfo.notes}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end gap-3 py-4 bg-gray-50 border-t border-gray-100">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startEditing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md
                            bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors duration-200
                            focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                  >
                    <Edit size={16} />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(addressInfo);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md
                            bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200
                            focus:outline-none focus:ring-2 focus:ring-red-200 shadow-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </motion.button>
                </CardFooter>
              </>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
};

export default AccordionAddressCard;