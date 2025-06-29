import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, fetchAdminProfile } from '@/store/auth-slice';
import { Store, Camera, Upload, Save, RotateCcw, Star, MapPin, Calendar, Globe, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/config/api.js';

const shopCategories = [
  'Electronics',
  'Fashion', 
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Books & Media',
  'Toys & Games',
  'Automotive',
  'Health & Wellness',
  'Food & Beverages',
  'Art & Crafts',
  'Other'
];

function AdminShopProfile() {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [formData, setFormData] = useState({
    shopName: user?.shopName || '',
    shopDescription: user?.shopDescription || '',
    shopCategory: user?.shopCategory || 'Other',
    shopWebsite: user?.shopWebsite || '',
    shopEstablished: user?.shopEstablished ? user.shopEstablished.split('T')[0] : '',
    shopPolicies: {
      returnPolicy: user?.shopPolicies?.returnPolicy || '',
      shippingPolicy: user?.shopPolicies?.shippingPolicy || '',
      warrantyPolicy: user?.shopPolicies?.warrantyPolicy || ''
    }
  });

  const [originalData, setOriginalData] = useState({ ...formData });

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      const updatedFormData = {
        shopName: user?.shopName || '',
        shopDescription: user?.shopDescription || '',
        shopCategory: user?.shopCategory || 'Other',
        shopWebsite: user?.shopWebsite || '',
        shopEstablished: user?.shopEstablished ? user.shopEstablished.split('T')[0] : '',
        shopPolicies: {
          returnPolicy: user?.shopPolicies?.returnPolicy || '',
          shippingPolicy: user?.shopPolicies?.shippingPolicy || '',
          warrantyPolicy: user?.shopPolicies?.warrantyPolicy || ''
        }
      };
      
      setFormData(updatedFormData);
      setOriginalData(updatedFormData);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('shopPolicies.')) {
      const policyType = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shopPolicies: {
          ...prev.shopPolicies,
          [policyType]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (value, name) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 100MB',
        variant: 'destructive'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select a valid image file',
        variant: 'destructive'
      });
      return;
    }

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await apiClient.post('/api/admin/shop/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Shop logo uploaded successfully!',
          variant: 'default'
        });
        // Refresh user profile to get updated logo
        dispatch(fetchAdminProfile());
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload shop logo',
        variant: 'destructive'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 100MB',
        variant: 'destructive'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select a valid image file',
        variant: 'destructive'
      });
      return;
    }

    setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append('banner', file);

      const response = await apiClient.post('/api/admin/shop/upload-banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Shop banner uploaded successfully!',
          variant: 'default'
        });
        // Refresh user profile to get updated banner
        dispatch(fetchAdminProfile());
      }
    } catch (error) {
      console.error('Banner upload error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload shop banner',
        variant: 'destructive'
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Filter only changed fields
      const changedFields = {};
      Object.keys(formData).forEach(key => {
        if (key === 'shopPolicies') {
          // Check if any policy field has changed
          const hasChanged = Object.keys(formData.shopPolicies).some(
            policyKey => formData.shopPolicies[policyKey] !== originalData.shopPolicies[policyKey]
          );
          if (hasChanged) {
            changedFields[key] = formData[key];
          }
        } else if (formData[key] !== originalData[key]) {
          changedFields[key] = formData[key];
        }
      });

      if (Object.keys(changedFields).length === 0) {
        toast({
          title: 'No Changes',
          description: 'No changes detected to save.',
          variant: 'default'
        });
        setLoading(false);
        return;
      }

      const result = await dispatch(updateUserProfile(changedFields));
      
      if (result.type.endsWith('/fulfilled')) {
        toast({
          title: 'Success',
          description: 'Shop profile updated successfully!',
          variant: 'default'
        });
        
        // Update original data to reflect the saved state
        setOriginalData({ ...formData });
        
        // Refresh user profile from backend
        dispatch(fetchAdminProfile());
      } else {
        throw new Error(result.payload?.message || 'Failed to update shop profile');
      }
    } catch (error) {
      console.error('Shop profile update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update shop profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...originalData });
    toast({
      title: 'Reset',
      description: 'Changes have been reset.',
      variant: 'default'
    });
  };

  const hasChanges = () => {
    return Object.keys(formData).some(key => {
      if (key === 'shopPolicies') {
        return Object.keys(formData.shopPolicies).some(
          policyKey => formData.shopPolicies[policyKey] !== originalData.shopPolicies[policyKey]
        );
      }
      return formData[key] !== originalData[key];
    });
  };

  return (
    <div className="space-y-6">
      {/* Shop Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Shop Profile Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-6">
            {/* Shop Banner */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Shop Banner
              </Label>
              {user?.shopBanner && (
                <div className="w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={user.shopBanner}
                    alt="Shop Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                </button>
                <p className="text-sm text-gray-500">
                  JPG, PNG up to 100MB. Recommended size: 1200x400px
                </p>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </div>

            {/* Shop Logo */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Shop Logo
              </Label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer relative"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {user?.shopLogo ? (
                      <img
                        src={user.shopLogo}
                        alt="Shop Logo"
                        className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 hover:border-blue-300 transition-colors"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200 hover:border-blue-300 transition-colors">
                        <Store className="w-8 h-8 text-white" />
                      </div>
                    )}
                    
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </motion.div>
                </div>
                
                <div className="flex-1">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {uploadingLogo ? 'Uploading...' : 'Change Logo'}
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    JPG, PNG up to 100MB. Recommended size: 400x400px
                  </p>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Shop Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopName" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Shop Name *
              </Label>
              <Input
                id="shopName"
                name="shopName"
                value={formData.shopName}
                onChange={handleInputChange}
                placeholder="Enter your shop name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shopCategory" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Category
              </Label>
              <Select 
                value={formData.shopCategory} 
                onValueChange={(value) => handleSelectChange(value, 'shopCategory')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shop category" />
                </SelectTrigger>
                <SelectContent>
                  {shopCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopDescription" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Shop Description
            </Label>
            <Textarea
              id="shopDescription"
              name="shopDescription"
              value={formData.shopDescription}
              onChange={handleInputChange}
              placeholder="Describe your shop, products, and what makes you unique..."
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-500">
              {formData.shopDescription.length}/500 characters
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopWebsite" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website (optional)
              </Label>
              <Input
                id="shopWebsite"
                name="shopWebsite"
                type="url"
                value={formData.shopWebsite}
                onChange={handleInputChange}
                placeholder="https://your-website.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shopEstablished" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Established Date (optional)
              </Label>
              <Input
                id="shopEstablished"
                name="shopEstablished"
                type="date"
                value={formData.shopEstablished}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Shop Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="returnPolicy">Return Policy</Label>
            <Textarea
              id="returnPolicy"
              name="shopPolicies.returnPolicy"
              value={formData.shopPolicies.returnPolicy}
              onChange={handleInputChange}
              placeholder="Describe your return policy..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shippingPolicy">Shipping Policy</Label>
            <Textarea
              id="shippingPolicy"
              name="shopPolicies.shippingPolicy"
              value={formData.shopPolicies.shippingPolicy}
              onChange={handleInputChange}
              placeholder="Describe your shipping policy..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="warrantyPolicy">Warranty Policy</Label>
            <Textarea
              id="warrantyPolicy"
              name="shopPolicies.warrantyPolicy"
              value={formData.shopPolicies.warrantyPolicy}
              onChange={handleInputChange}
              placeholder="Describe your warranty policy..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shop Stats Preview */}
      {user?.shopName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Shop Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-4">This is how your shop will appear to customers:</p>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-3 mb-3">
                  {user?.shopLogo ? (
                    <img
                      src={user.shopLogo}
                      alt={formData.shopName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Store className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{formData.shopName || 'Your Shop Name'}</h3>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {formData.shopCategory}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {formData.shopDescription || 'Your shop description will appear here...'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {(user?.baseCity || user?.baseRegion) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{user.baseCity}{user.baseCity && user.baseRegion && ', '}{user.baseRegion}</span>
                    </div>
                  )}
                  {user?.shopRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{user.shopRating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
        <button
          onClick={handleReset}
          disabled={!hasChanges() || loading}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Changes
        </button>
        
        <button
          onClick={handleSave}
          disabled={!hasChanges() || loading}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Saving...' : 'Save Shop Profile'}
        </button>
      </div>
    </div>
  );
}

export default AdminShopProfile; 