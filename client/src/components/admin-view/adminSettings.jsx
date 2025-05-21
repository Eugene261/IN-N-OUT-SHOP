import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Save, 
  Clock, 
  Truck, 
  MapPin, 
  DollarSign, 
  Map 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { updateUserInfo } from '@/store/auth-slice';

const AdminSettings = ({ initialTab = 'general' }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  
  // Shipping preferences state
  const [baseRegion, setBaseRegion] = useState(user?.baseRegion || '');
  const [baseCity, setBaseCity] = useState(user?.baseCity || '');
  const [enableRegionalRates, setEnableRegionalRates] = useState(
    user?.shippingPreferences?.enableRegionalRates !== undefined ? 
    user?.shippingPreferences?.enableRegionalRates : true
  );
  const [defaultBaseRate, setDefaultBaseRate] = useState(
    user?.shippingPreferences?.defaultBaseRate || 40
  );
  const [defaultOutOfRegionRate, setDefaultOutOfRegionRate] = useState(
    user?.shippingPreferences?.defaultOutOfRegionRate || 70
  );
  
  // List of time zones
  const timeZones = [
    'UTC',
    'Africa/Accra',
    'Africa/Lagos',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];
  
  // List of Ghana regions for baseRegion selection
  const ghanaRegions = [
    'Greater Accra',
    'Ashanti',
    'Western',
    'Eastern',
    'Central',
    'Volta',
    'Northern',
    'Upper East',
    'Upper West',
    'Brong-Ahafo',
    'North East',
    'Savannah',
    'Bono East',
    'Ahafo',
    'Western North',
    'Oti'
  ];

  const saveSettings = async () => {
    if (!isAuthenticated || !user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      setLoading(true);
      
      const token = user.token || localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token missing');
        setLoading(false);
        return;
      }
      
      // Prepare shipping preferences
      const shippingPreferences = {
        defaultBaseRate: parseFloat(defaultBaseRate),
        defaultOutOfRegionRate: parseFloat(defaultOutOfRegionRate),
        enableRegionalRates
      };
      
      // Prepare the data to be sent
      const userData = {
        timezone,
        baseRegion,
        baseCity,
        shippingPreferences
      };
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/users/${user._id}/settings`,
        userData,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Update user in Redux store with all the new settings
        const updatedUser = {
          ...user,
          timezone,
          baseRegion,
          baseCity,
          shippingPreferences
        };
        
        dispatch(updateUserInfo(updatedUser));
        
        // Update localStorage
        const localUserData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...localUserData,
          ...updatedUser
        }));
        
        toast.success('Settings saved successfully');
      } else {
        toast.error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="mb-4 grid grid-cols-2 w-full">
          <TabsTrigger value="general" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" />
            Shipping
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                User Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <Input
                    type="text"
                    value={user?.userName || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium mb-1">
                    <Clock className="mr-2 h-4 w-4" />
                    Timezone
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    {timeZones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select your timezone to ensure all dates and times are displayed correctly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Shipping Preferences
              </CardTitle>
              <CardDescription>
                Configure your base location and shipping rates for different regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Base Location Section */}
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h3 className="text-md font-medium flex items-center mb-4">
                    <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                    Your Base Location
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your base location is used to calculate shipping costs. Customers in your base region typically pay less for shipping.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Base Region</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={baseRegion}
                        onChange={(e) => setBaseRegion(e.target.value)}
                      >
                        <option value="">Select your region</option>
                        {ghanaRegions.map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Base City</label>
                      <Input
                        type="text"
                        placeholder="e.g., Accra"
                        value={baseCity}
                        onChange={(e) => setBaseCity(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Shipping Rates Section */}
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h3 className="text-md font-medium flex items-center mb-4">
                    <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                    Default Shipping Rates
                  </h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Switch
                        id="regional-rates"
                        checked={enableRegionalRates}
                        onCheckedChange={setEnableRegionalRates}
                      />
                      <Label htmlFor="regional-rates" className="ml-2">
                        Enable regional shipping rates
                      </Label>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Set default shipping rates for orders within your base region and for orders outside your region. 
                    {enableRegionalRates ? 
                      " Customers in your base region will pay less for shipping." : 
                      " All customers will pay the same shipping rate regardless of location."}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Base Region Rate (GHS)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={defaultBaseRate}
                        onChange={(e) => setDefaultBaseRate(e.target.value)}
                        className={!enableRegionalRates ? "opacity-50" : ""}
                        disabled={!enableRegionalRates}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Rate for customers within your base region
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Other Regions Rate (GHS)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={defaultOutOfRegionRate}
                        onChange={(e) => setDefaultOutOfRegionRate(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Rate for customers outside your base region
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-blue-600 flex items-center">
                      <Map className="mr-1 h-4 w-4" />
                      <a href="/admin/shipping-zones" className="hover:underline">
                        Configure advanced shipping zones
                      </a>
                    </p>
                  </div>
                  
                  <Button
                    onClick={saveSettings}
                    disabled={loading}
                    className="flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;