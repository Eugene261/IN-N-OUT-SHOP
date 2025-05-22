import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import CommonForm from '../common/form';
import { addressFormControls } from '@/config';
import { PlusCircle, MapPin, Home, Navigation, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { addNewAddress, deleteAddress, fetchAllAddresses, editAddress } from '@/store/shop/address-slice';
import AccordionAddressCard from './addressCard';
import { toast } from 'sonner';

const initialAddressFormData = {
    customerName: '', // Add customer name field
    region: '',
    address: '',
    city: '',
    phone: '',
    notes: '',
};

function Address({setCurrentSelectedAddress, selectedId}) {
    const [formData, setFormData] = useState(initialAddressFormData);
    const [showForm, setShowForm] = useState(false);
    const [errors, setErrors] = useState({});
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { addressList } = useSelector(state => state.shopAddress);
    
    function validateForm() {
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
    }

    function handleDeleteAddress(getCurrentAddress) {
        dispatch(deleteAddress({userId: user?.id, addressId: getCurrentAddress._id})).then(data => {
            if (data?.payload?.success) {
                dispatch(fetchAllAddresses(user?.id));
                toast.success('Address deleted successfully', {
                    description: 'The address has been removed from your list'
                });
            } else {
                toast.error('Failed to delete address', {
                    description: 'Please try again later'
                });
            }
        }).catch(error => {
            toast.error('Error occurred while deleting address');
        });
    }

    function handleEditAddress({addressId, formData: updatedFormData}) {
        dispatch(editAddress({
            userId: user?.id,
            addressId: addressId,
            formData: updatedFormData
        })).then(data => {
            if (data?.payload?.success) {
                dispatch(fetchAllAddresses(user?.id));
                toast.success('Address updated successfully', {
                    description: 'Your address information has been updated'
                });
            } else {
                toast.error('Failed to update address', {
                    description: 'Please check your information and try again'
                });
            }
        }).catch(error => {
            toast.error('Error occurred while updating address');
        });
    }

    function isFormValid() {
        return addressFormControls.every(control => {
            if (!control.required) return true;
            const value = formData[control.name]?.toString().trim();
            return !!value;
        });
    }

    function handleManageAddress(event) {
        event.preventDefault();
        if (!validateForm()) return;


        if(addressList.length >= 3 ){
            setFormData(initialAddressFormData)
            toast.error('You can add maximum of 3 addresses',{
                description : "You can't add new address"
            })

            return;
        }
        
        dispatch(addNewAddress({
            ...formData,
            userId: user?.id
        })).then(data => {
            if (data?.payload?.success) {
                dispatch(fetchAllAddresses(user?.id));
                setFormData(initialAddressFormData);
                setShowForm(false);
                setErrors({});
                toast.success('Address added successfully', {
                    description: 'Your new address has been saved'
                });
            } else {
                toast.error('Failed to add address', {
                    description: 'Please check your information and try again'
                });
            }
        }).catch(error => {
            toast.error('Error occurred while adding address');
        });
    }

    useEffect(() => {
        dispatch(fetchAllAddresses(user?.id));
    }, [dispatch, user?.id]);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
            className="max-w-4xl mx-auto p-4"
        >
            <Card className="border border-gray-200 shadow-md rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full shadow-sm">
                                <MapPin size={20} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-900">Shipping Addresses</h3>
                                <p className="text-sm text-gray-500">Manage your delivery locations</p>
                            </div>
                        </div>
                        <motion.button 
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200 ${showForm 
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <PlusCircle size={18} />
                            <span className="font-medium">{showForm ? 'Cancel' : 'Add New Address'}</span>
                        </motion.button>
                    </div>
                </CardHeader>

                <AnimatePresence mode="wait">
                    {showForm ? (
                        <motion.div
                            key="address-form"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                        >
                            <CardContent className="p-6 bg-white">
                                <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-full mt-0.5">
                                            <AlertCircle size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-blue-800">Add a New Address</h4>
                                            <p className="text-xs text-blue-600 mt-1">Please fill in all required fields to add a new shipping address.</p>
                                        </div>
                                    </div>
                                </div>
                                <CommonForm 
                                    formControls={addressFormControls}
                                    formData={formData}
                                    setFormData={setFormData}
                                    buttonText="Save Address"
                                    onSubmit={handleManageAddress}
                                    buttonDisabled={!isFormValid()}
                                    errors={errors}
                                />
                            </CardContent>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="address-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-6"
                        >
                            {addressList && addressList.length > 0 ? (
                                <div className="space-y-4">
                                    {addressList.length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <Navigation className="text-indigo-500" size={16} />
                                                {setCurrentSelectedAddress ? 'Select an address for delivery' : 'Your saved addresses'}
                                            </p>
                                        </div>
                                    )}
                                    {addressList.map(singleAddressItem => (
                                        <AccordionAddressCard 
                                            selectedId={selectedId}
                                            key={singleAddressItem._id} 
                                            addressInfo={singleAddressItem}
                                            handleDeleteAddress={handleDeleteAddress}
                                            handleEditAddress={handleEditAddress}
                                            setCurrentSelectedAddress={setCurrentSelectedAddress}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 px-4">
                                    <div className="bg-gray-50 p-6 rounded-xl inline-flex items-center justify-center mb-4">
                                        <Home className="h-16 w-16 text-indigo-300" />
                                    </div>
                                    <h3 className="mt-2 text-lg font-medium text-gray-900">No addresses found</h3>
                                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">You haven't added any shipping addresses yet. Add your first address to get started.</p>
                                    <div className="mt-6">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowForm(true)}
                                            className="inline-flex items-center px-5 py-2.5 shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                        >
                                            <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                            Add Your First Address
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}

export default Address;