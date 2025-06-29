import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import SimpleForm from '../common/SimpleForm';
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
        if (user) {
            dispatch(fetchAllAddresses(user?.id));
        }
    }, [dispatch, user]);

    // Auto-select address logic with improved detection
    useEffect(() => {
        if (addressList && addressList.length > 0 && setCurrentSelectedAddress) {
            // If no address is currently selected
            if (!selectedId) {
                if (addressList.length === 1) {
                    // Auto-select the only address
                    const singleAddress = addressList[0];
                    setCurrentSelectedAddress(singleAddress);
                    toast.success('Address automatically selected', {
                        description: `Using: ${singleAddress.city}, ${singleAddress.region}`,
                        duration: 3000
                    });
                } else if (addressList.length > 1) {
                    // Multiple addresses - notify user to select
                    toast.info(`${addressList.length} addresses found`, {
                        description: 'Please select your preferred delivery address',
                        duration: 4000
                    });
                }
            } else {
                // If an address is selected, verify it still exists in the list
                const selectedExists = addressList.find(addr => addr._id === selectedId._id);
                if (!selectedExists && addressList.length > 0) {
                    // Selected address no longer exists, auto-select the first one
                    setCurrentSelectedAddress(addressList[0]);
                    toast.warning('Previous address unavailable', {
                        description: 'Selected the first available address',
                        duration: 3000
                    });
                }
            }
        } else if (addressList && addressList.length === 0 && setCurrentSelectedAddress) {
            // No addresses found
            toast.error('No delivery addresses found', {
                description: 'Please add a delivery address to continue',
                duration: 5000
            });
        }
    }, [addressList, selectedId, setCurrentSelectedAddress]);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
            className="max-w-4xl mx-auto p-4"
        >
            <Card className="border border-gray-200 shadow-lg rounded-xl overflow-hidden bg-white">
                {/* Unified Header */}
                <CardHeader className="bg-white border-b border-gray-200 p-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gray-100 rounded-full">
                                    <MapPin size={24} className="text-gray-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Addresses</h2>
                                    <p className="text-gray-600 mt-1">Manage your delivery locations</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Add Address Button */}
                        <motion.button 
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 self-start"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <PlusCircle size={16} />
                            <span className="font-medium">{showForm ? 'Cancel' : 'Add Address'}</span>
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
                                <div className="p-6 bg-white">
                                    <SimpleForm 
                                        formControls={addressFormControls}
                                        formData={formData}
                                        setFormData={setFormData}
                                        buttonText="Save Address"
                                        onSubmit={handleManageAddress}
                                        buttonDisabled={!isFormValid()}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Address List */}
                    <div className="p-6">
                        {addressList && addressList.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Your Addresses ({addressList.length}/3)
                                    </h3>
                                </div>

                                <div className="grid gap-3">
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
                            <div className="text-center py-8">
                                <div className="bg-gray-100 p-6 rounded-lg inline-flex items-center justify-center mb-4">
                                    <Home className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Add your first shipping address to get started.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowForm(true)}
                                    className="inline-flex items-center px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors duration-200"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Address
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