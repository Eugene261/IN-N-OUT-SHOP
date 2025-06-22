import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import CommonForm from '../common/form';
import { addressFormControls } from '@/config';
import { PlusCircle, MapPin, Home, Navigation, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
        const userId = user?.id || user?._id;
        dispatch(deleteAddress({userId: userId, addressId: getCurrentAddress._id})).then(data => {
            if (data?.payload?.success) {
                dispatch(fetchAllAddresses(userId));
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
        const userId = user?.id || user?._id;
        dispatch(editAddress({
            userId: userId,
            addressId: addressId,
            formData: updatedFormData
        })).then(data => {
            if (data?.payload?.success) {
                dispatch(fetchAllAddresses(userId));
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
        
        const userId = user?.id || user?._id;
        dispatch(addNewAddress({
            ...formData,
            userId: userId
        })).then(data => {
            if (data?.payload?.success) {
                dispatch(fetchAllAddresses(userId));
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
        const userId = user?.id || user?._id;
        if (userId) {
            dispatch(fetchAllAddresses(userId));
        }
    }, [dispatch, user?.id, user?._id]);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
            className="max-w-4xl mx-auto p-4"
        >
            <Card className="border border-gray-200 shadow-lg rounded-xl overflow-hidden bg-white">
                {/* Unified Header */}
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                                    <MapPin size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Shipping Addresses</h2>
                                    <p className="text-indigo-100 mt-1">Manage your delivery locations</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Add Address Button */}
                        <motion.button 
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 text-white hover:bg-white/30 transition-all duration-200 self-start"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <PlusCircle size={20} />
                            <span className="font-medium">{showForm ? 'Cancel' : 'Add New Address'}</span>
                            {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </motion.button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* Add Address Form */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="border-b border-gray-200"
                            >
                                <div className="p-6 bg-gray-50">
                                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start space-x-3">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                                <AlertCircle size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-blue-800">Add New Address</h4>
                                                <p className="text-xs text-blue-600 mt-1">Fill in all required fields to add a new shipping address. You can add up to 3 addresses.</p>
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
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Address List */}
                    <div className="p-6">
                        {addressList && addressList.length > 0 ? (
                            <div className="space-y-6">
                                {/* List Header */}
                                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <Navigation className="text-indigo-500" size={20} />
                                            Your Addresses
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {setCurrentSelectedAddress ? 'Select an address for delivery' : `${addressList.length} saved address${addressList.length > 1 ? 'es' : ''}`}
                                        </p>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {addressList.length}/3 addresses
                                    </div>
                                </div>

                                {/* Address Cards */}
                                <div className="grid gap-4">
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
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="bg-gray-50 p-8 rounded-2xl inline-flex items-center justify-center mb-6">
                                    <Home className="h-20 w-20 text-indigo-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No addresses found</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-6">
                                    You haven't added any shipping addresses yet. Add your first address to get started with deliveries.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowForm(true)}
                                    className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Add Your First Address
                                </motion.button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default Address;