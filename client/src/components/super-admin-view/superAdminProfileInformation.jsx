import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, fetchAdminProfile } from '@/store/auth-slice';
import { User, Camera, Mail, Phone, Calendar, MapPin, Building, Crown, Shield, Save, RotateCcw, Star } from 'lucide-react';
import { motion } from 'framer-motion';

function SuperAdminProfileInformation() {
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
      
      console.log('SuperAdmin: User data updated, setting form data with baseRegion:', user?.baseRegion, 'baseCity:', user?.baseCity);
      
      setFormData(updatedFormData);
      setOriginalData(updatedFormData);
    }
  }, [user]);

  // Fetch user profile on component mount only if we don't have user data
  useEffect(() => {
    console.log('SuperAdmin Profile component mounted, checking if profile fetch is needed...');
    console.log('Current user in Redux:', user);
    console.log('Current user in localStorage:', JSON.parse(localStorage.getItem('user') || '{}'));
    
    // Only fetch if we don't have user data or if essential fields are missing
    if (!user || !user.firstName || !user.email) {
      console.log('SuperAdmin: User data missing, fetching profile...');
      dispatch(fetchAdminProfile());
    } else {
      console.log('SuperAdmin: User data already available, skipping profile fetch');
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
      console.error('SuperAdmin avatar upload error:', error);
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
      console.log('=== SUPERADMIN PROFILE UPDATE DEBUG ===');
      console.log('User from Redux:', user);
      console.log('Auth token:', localStorage.getItem('token'));
      console.log('Current form data:', formData);
      console.log('Original data:', originalData);
      console.log('Specific location fields:');
      console.log('- baseRegion:', formData.baseRegion, '(original:', originalData.baseRegion, ')');
      console.log('- baseCity:', formData.baseCity, '(original:', originalData.baseCity, ')');

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

      console.log('SuperAdmin: Dispatching updateUserProfile...');
      const result = await dispatch(updateUserProfile(changedFields));
      console.log('SuperAdmin: Update result:', result);
      
      if (result.type.endsWith('/fulfilled')) {
        console.log('SuperAdmin: Profile update successful - baseRegion:', result.payload?.data?.baseRegion, 'baseCity:', result.payload?.data?.baseCity);
        toast({
          title: 'Success',
          description: 'SuperAdmin profile updated successfully!',
          variant: 'default'
        });
        
        // Update original data to reflect the saved state
        setOriginalData({ ...formData });
        
        // Refresh user profile from backend to ensure we have the latest data
        const profileResult = await dispatch(fetchAdminProfile());
        
        if (profileResult.type.endsWith('/fulfilled')) {
          console.log('SuperAdmin: Profile refreshed successfully after save');
        } else {
          console.warn('SuperAdmin: Failed to refresh profile after save, but update was successful');
        }
      } else {
        console.error('SuperAdmin: Update failed with result:', result);
        console.error('SuperAdmin: Error payload:', result.payload);
        throw new Error(result.payload?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('SuperAdmin: Profile update error:', error);
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
      {/* SuperAdmin Status Section */}
      <Card className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-500" />
            <span className="text-yellow-800">SuperAdmin Status & Privileges</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Account Status */}
            <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-lg border border-yellow-100">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Account Status</p>
                <p className="text-sm text-green-600 font-medium">Active SuperAdmin</p>
                <p className="text-xs text-gray-500">Full System Access</p>
              </div>
            </div>

            {/* User Role */}
            <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-lg border border-yellow-100">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Role</p>
                <p className="text-sm text-blue-600 font-medium">{user?.role || 'SuperAdmin'}</p>
                <p className="text-xs text-gray-500">Highest Privilege Level</p>
              </div>
            </div>

            {/* Account Info */}
            <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-lg border border-yellow-100">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Account ID</p>
                <p className="text-sm text-purple-600 font-medium">{user?._id?.slice(-8).toUpperCase() || 'SA-ADMIN'}</p>
                <p className="text-xs text-gray-500">System Identifier</p>
              </div>
            </div>
          </div>

          {/* Privileges List */}
          <div className="mt-6 p-4 bg-white/70 rounded-lg border border-yellow-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              SuperAdmin Privileges
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Manage all users and accounts
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Access all system settings
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Manage products and inventory
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Process vendor payments
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                View comprehensive analytics
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                System-wide configuration access
              </div>
            </div>
          </div>

          {/* Last Login Info */}
          {user?.lastLogin && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-blue-700">
                  Last login: {new Date(user.lastLogin).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Location & Contact Display */}      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-blue-200">        <CardHeader>          <CardTitle className="flex items-center gap-3">            <MapPin className="w-6 h-6 text-blue-500" />            <span className="text-blue-800">Current Location & Contact Information</span>          </CardTitle>        </CardHeader>        <CardContent>          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">            {/* Current Location */}            <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-lg border border-blue-100">              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">                <MapPin className="h-6 w-6 text-white" />              </div>              <div>                <p className="font-semibold text-gray-900">Base Location</p>                <p className="text-sm text-green-600 font-medium">                  {user?.baseCity && user?.baseRegion                     ? `${user.baseCity}, ${user.baseRegion}`                    : 'Not set yet'                  }                </p>                <p className="text-xs text-gray-500">Primary operating location</p>              </div>            </div>            {/* Contact Info */}            <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-lg border border-blue-100">              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">                <Phone className="h-6 w-6 text-white" />              </div>              <div>                <p className="font-semibold text-gray-900">Contact</p>                <p className="text-sm text-purple-600 font-medium">{user?.phone || 'Not provided'}</p>                <p className="text-xs text-gray-500">Primary phone number</p>              </div>            </div>            {/* Organization */}            <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-lg border border-blue-100">              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">                <Building className="h-6 w-6 text-white" />              </div>              <div>                <p className="font-semibold text-gray-900">Organization</p>                <p className="text-sm text-orange-600 font-medium">{user?.shopName || 'Not specified'}</p>                <p className="text-xs text-gray-500">Company/Organization name</p>              </div>            </div>          </div>        </CardContent>      </Card>

      {/* Profile Picture Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            SuperAdmin Profile Picture
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
                    alt="SuperAdmin Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-yellow-200 hover:border-yellow-300 transition-colors"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center border-4 border-yellow-200 hover:border-yellow-300 transition-colors">
                    <span className="text-2xl font-bold text-white">
                      {(user?.firstName || user?.userName || 'S').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-yellow-200">
                  <Crown className="h-4 w-4 text-yellow-500" />
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
                className="inline-flex items-center px-4 py-2 border border-yellow-300 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Change SuperAdmin Picture'}
              </button>
              <p className="mt-2 text-sm text-gray-500">
                JPG, PNG up to 5MB. Click to upload a new SuperAdmin profile picture.
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
            SuperAdmin Personal Information
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

      {/* SuperAdmin Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            SuperAdmin Information
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

          <div className="space-y-2">
            <Label htmlFor="shopName" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Organization/Company Name
            </Label>
            <Input
              id="shopName"
              name="shopName"
              value={formData.shopName}
              onChange={handleInputChange}
              placeholder="Enter your organization or company name"
            />
          </div>

          {/* SuperAdmin Badge */}
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-yellow-800">SuperAdmin Access</h3>
                <p className="text-sm text-yellow-600">You have full system administration privileges</p>
              </div>
            </div>
          </div>
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
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Saving...' : 'Save SuperAdmin Profile'}
        </button>
      </div>
    </div>
  );
}

export default SuperAdminProfileInformation; 