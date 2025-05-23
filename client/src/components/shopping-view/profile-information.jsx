import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Mail, Phone, Calendar, User, Building } from 'lucide-react';
import { setUser } from '@/store/auth-slice';

function ProfileInformation() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    userName: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    shopName: '',
    avatar: ''
  });

  // Check if user is a vendor (has shop name or is admin/superAdmin)
  const isVendor = user?.shopName || user?.role === 'admin' || user?.role === 'superAdmin';

  // Fetch fresh user profile data from server
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        const userData = data.data;
        setProfileData({
          userName: userData.userName || '',
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
          shopName: userData.shopName || '',
          avatar: userData.avatar || ''
        });
        
        // Update Redux store with fresh data
        dispatch(setUser(userData));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Always fetch fresh data from server on mount
    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Update local state when Redux user changes (backup)
    if (user) {
      setProfileData({
        userName: user.userName || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        shopName: user.shopName || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Updating profile with data:', profileData);
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      console.log('Profile update response:', data);

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully!',
          variant: 'default'
        });
        
        // Update Redux store with new user data
        dispatch(setUser({
          ...user,
          ...data.data
        }));
        
        // Fetch fresh profile data to ensure consistency
        await fetchUserProfile();
        
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image size must be less than 5MB',
          variant: 'destructive'
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select a valid image file',
          variant: 'destructive'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData((prev) => ({
          ...prev,
          avatar: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superAdmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getInitials = (firstName, lastName, userName) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return userName ? userName.slice(0, 2).toUpperCase() : 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Profile Information</CardTitle>
          <Badge className={getRoleColor(user?.role)}>
            {user?.role === 'superAdmin' ? 'Super Admin' : user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileData.avatar} alt="Profile" />
                <AvatarFallback className="text-lg">
                  {getInitials(profileData.firstName, profileData.lastName, profileData.userName)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/80 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">
                {profileData.firstName || profileData.lastName 
                  ? `${profileData.firstName} ${profileData.lastName}`.trim()
                  : profileData.userName
                }
              </h3>
              <div className="space-y-1 mt-2">
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profileData.email}
                </p>
                {profileData.phone && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {profileData.phone}
                  </p>
                )}
                {profileData.dateOfBirth && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Born {formatDate(profileData.dateOfBirth)}
                  </p>
                )}
                {user?.lastLogin && (
                  <p className="text-sm text-muted-foreground">
                    Last login: {new Date(user.lastLogin).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="userName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="userName"
                name="userName"
                value={profileData.userName}
                onChange={handleInputChange}
                placeholder="Enter username"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleInputChange}
                disabled={true} // Email typically shouldn't be editable
                placeholder="Enter email"
              />
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={profileData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={profileData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={profileData.dateOfBirth}
                onChange={handleInputChange}
              />
            </div>

            {/* Shop Name - Only show for vendors or users who already have a shop */}
            {(isVendor || profileData.shopName) && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="shopName" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Shop Name
                </Label>
                <Input
                  id="shopName"
                  name="shopName"
                  value={profileData.shopName}
                  onChange={handleInputChange}
                  placeholder="Enter shop name (optional)"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Reset form data using current user data from Redux store
                const currentUser = user;
                if (currentUser) {
                  setProfileData({
                    userName: currentUser.userName || '',
                    email: currentUser.email || '',
                    firstName: currentUser.firstName || '',
                    lastName: currentUser.lastName || '',
                    phone: currentUser.phone || '',
                    dateOfBirth: currentUser.dateOfBirth ? currentUser.dateOfBirth.split('T')[0] : '',
                    shopName: currentUser.shopName || '',
                    avatar: currentUser.avatar || ''
                  });
                }
              }}
              disabled={loading}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ProfileInformation; 