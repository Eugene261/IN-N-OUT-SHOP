import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, fetchAdminProfile } from '@/store/auth-slice';
import { User, Camera, Mail, Phone, Calendar, MapPin, Building, Crown, Shield, Save, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

function AdminProfileInformation() {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    baseRegion: user?.baseRegion || '',
    baseCity: user?.baseCity || '',
    shopName: user?.shopName || '',
  });

  const [originalData, setOriginalData] = useState({ ...formData });

  // Update form data when user data changes in Redux (e.g., after page refresh or profile fetch)
  useEffect(() => {
    if (user) {
      const updatedFormData = {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        baseRegion: user?.baseRegion || '',
        baseCity: user?.baseCity || '',
        shopName: user?.shopName || '',
      };
      
      console.log('User data changed, updating form data:', updatedFormData);
      setFormData(updatedFormData);
      setOriginalData(updatedFormData);
    }
  }, [user]);

  // Fetch user profile on component mount only if we don't have user data
  useEffect(() => {
    console.log('Profile component mounted, checking if profile fetch is needed...');
    console.log('Current user in Redux:', user);
    console.log('Current user in localStorage:', JSON.parse(localStorage.getItem('user') || '{}'));
    
    // Only fetch if we don't have user data or if essential fields are missing
    if (!user || !user.firstName || !user.email) {
      console.log('User data missing, fetching profile...');
      dispatch(fetchAdminProfile());
    } else {
      console.log('User data already available, skipping profile fetch');
    }
  }, [dispatch, user?.firstName, user?.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
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

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const avatar = e.target.result;
        
        const updateData = { avatar };
        const result = await dispatch(updateUserProfile(updateData));
        
        if (result.type.endsWith('/fulfilled')) {
          toast({
            title: 'Success',
            description: 'Profile picture updated successfully!',
            variant: 'default'
          });
          // Refresh user profile to get updated avatar
          dispatch(fetchAdminProfile());
        } else {
          throw new Error('Failed to update profile picture');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile picture',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      console.log('=== PROFILE UPDATE DEBUG ===');
      console.log('User from Redux:', user);
      console.log('Auth token:', localStorage.getItem('token'));
      console.log('Current form data:', formData);
      console.log('Original data:', originalData);

      // Filter only changed fields
      const changedFields = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          changedFields[key] = formData[key];
        }
      });

      console.log('Changed fields:', changedFields);

      if (Object.keys(changedFields).length === 0) {
        toast({
          title: 'No Changes',
          description: 'No changes detected to save.',
          variant: 'default'
        });
        setLoading(false);
        return;
      }

      console.log('Dispatching updateUserProfile...');
      const result = await dispatch(updateUserProfile(changedFields));
      console.log('Update result:', result);
      
      if (result.type.endsWith('/fulfilled')) {
        console.log('Profile update successful, result:', result);
        toast({
          title: 'Success',
          description: 'Profile updated successfully!',
          variant: 'default'
        });
        
        // Update original data to reflect the saved state
        setOriginalData({ ...formData });
        
        // Refresh user profile from backend to ensure we have the latest data
        console.log('Fetching updated profile from backend...');
        const profileResult = await dispatch(fetchAdminProfile());
        console.log('Profile fetch result after save:', profileResult);
        
        if (profileResult.type.endsWith('/fulfilled')) {
          console.log('Profile refreshed successfully after save');
        } else {
          console.warn('Failed to refresh profile after save, but update was successful');
        }
      } else {
        console.error('Update failed with result:', result);
        console.error('Error payload:', result.payload);
        throw new Error(result.payload?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
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

  const hasChanges = Object.keys(formData).some(key => formData[key] !== originalData[key]);
  const isSuperAdmin = user?.role === 'superAdmin';

  return (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer relative"
                onClick={handleAvatarClick}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 hover:border-blue-300 transition-colors"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200 hover:border-blue-300 transition-colors">
                    <span className="text-2xl font-bold text-white">
                      {(user?.firstName || user?.userName || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-gray-200">
                  {isSuperAdmin ? (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Shield className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </motion.div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Change Picture'}
              </button>
              <p className="mt-2 text-sm text-gray-500">
                JPG, PNG up to 5MB. Click to upload a new profile picture.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseRegion" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Base Region
              </Label>
              <Input
                id="baseRegion"
                name="baseRegion"
                value={formData.baseRegion}
                onChange={handleInputChange}
                placeholder="Enter your region"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="baseCity" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Base City
              </Label>
              <Input
                id="baseCity"
                name="baseCity"
                value={formData.baseCity}
                onChange={handleInputChange}
                placeholder="Enter your city"
              />
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'superAdmin') && (
            <div className="space-y-2">
              <Label htmlFor="shopName" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Shop/Business Name
              </Label>
              <Input
                id="shopName"
                name="shopName"
                value={formData.shopName}
                onChange={handleInputChange}
                placeholder="Enter your shop or business name"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleReset}
          disabled={!hasChanges || loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Changes
        </button>
        
        <button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default AdminProfileInformation; 