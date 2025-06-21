import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Settings, MapPin, Ship, DollarSign, User, Shield, Info } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

function UserSettings() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(user);
    const [settings, setSettings] = useState({    baseRegion: '',    baseCity: ''  });

  // Check if user is a vendor (has shop name or is admin/superAdmin)
  const isVendor = user?.shopName || user?.role === 'admin' || user?.role === 'superAdmin';

  useEffect(() => {
    // Fetch complete user profile if some fields are missing
    fetchCompleteUserProfile();
    
    if (isVendor) {
      fetchUserSettings();
    }
  }, [isVendor]);

  const fetchCompleteUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setUserProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/settings/shipping`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Settings updated successfully!',
          variant: 'default'
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Regular user view (non-vendors)
  if (!isVendor) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Account Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Account Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Account Status:</span>
                    <span className={userProfile?.isActive ? 'text-green-600' : 'text-red-600'}>
                      {userProfile?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Account Type:</span>
                    <span className="capitalize">Customer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Member Since:</span>
                    <span>
                      {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{userProfile?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Username:</span>
                    <span>{userProfile?.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Last Login:</span>
                    <span>
                      {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Become a Vendor Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Sell on Our Platform</h3>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-900">Want to start selling?</h4>
                  <p className="text-blue-700 text-sm">
                    Join thousands of sellers on our platform! Set up your shop and start selling your products today.
                  </p>
                  <div className="space-y-2 text-sm text-blue-600">
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Easy shop setup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Secure payment processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Marketing tools included</span>
                    </div>
                  </div>
                  <button 
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                    onClick={() => {
                      // Navigate to shop setup or contact page
                      console.log('Contact Us button clicked, navigating to /shop/contact-us');
                      try {
                        navigate('/shop/contact-us');
                      } catch (error) {
                        console.error('Navigation error:', error);
                      }
                    }}
                  >
                    Contact Us to Start Selling
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vendor/Admin view
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Vendor Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Location Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Business Location</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseRegion">Base Region</Label>
                <Input
                  id="baseRegion"
                  value={settings.baseRegion}
                  onChange={(e) => handleInputChange('baseRegion', e.target.value)}
                  placeholder="Enter your base region"
                />
                <p className="text-sm text-muted-foreground">
                  The region where your business is located
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseCity">Base City</Label>
                <Input
                  id="baseCity"
                  value={settings.baseCity}
                  onChange={(e) => handleInputChange('baseCity', e.target.value)}
                  placeholder="Enter your base city"
                />
                <p className="text-sm text-muted-foreground">
                  The city where your business is located
                </p>
              </div>
            </div>
          </div>

                    <Separator />          {/* Shipping Zone Management */}          <div className="space-y-4">            <div className="flex items-center gap-2">              <Ship className="w-5 h-5" />              <h3 className="text-lg font-semibold">Shipping Management</h3>            </div>                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">              <div className="space-y-3">                <h4 className="font-semibold text-blue-900">Zone-Based Shipping</h4>                <p className="text-blue-700 text-sm">                  Set up custom shipping zones and rates for different regions. This gives you complete control over your shipping costs.                </p>                <button                   type="button"                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"                  onClick={() => {                    if (user?.role === 'admin' || user?.role === 'superAdmin') {                      navigate('/admin/shipping-zones');                    } else {                      toast({                        title: 'Info',                        description: 'Contact admin to set up shipping zones for your shop.',                        variant: 'default'                      });                    }                  }}                >                  {user?.role === 'admin' || user?.role === 'superAdmin' ? 'Manage Shipping Zones' : 'Request Shipping Setup'}                </button>              </div>            </div>          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Account Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Account Status:</span>
                  <span className={userProfile?.isActive ? 'text-green-600' : 'text-red-600'}>
                    {userProfile?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <span className="capitalize">
                    {userProfile?.role === 'superAdmin' ? 'Super Admin' : userProfile?.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Shop Name:</span>
                  <span>{userProfile?.shopName || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Member Since:</span>
                  <span>
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Balance:</span>
                  <span>GH₵ {userProfile?.balance || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Earnings:</span>
                  <span>GH₵ {userProfile?.totalEarnings || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Last Login:</span>
                  <span>
                    {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto min-w-[150px]"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default UserSettings; 