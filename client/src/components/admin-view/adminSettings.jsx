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

import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Save, 
  Clock, 
  Truck, 
  MapPin, 
  Map 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateUserSettings } from '@/store/auth-slice';

const AdminSettings = ({ initialTab = 'general' }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  
  // Location state
  const [baseRegion, setBaseRegion] = useState(user?.baseRegion || '');
  const [baseCity, setBaseCity] = useState(user?.baseCity || '');
  
  // Shipping preferences state
  const [shippingPreferences, setShippingPreferences] = useState({
    defaultBaseRate: user?.shippingPreferences?.defaultBaseRate || 0,
    enableRegionalRates: user?.shippingPreferences?.enableRegionalRates !== false
  });
  
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
      
      // Prepare the data to be sent
      const settingsData = {
        timezone,
        baseRegion,
        baseCity,
        shippingPreferences
      };
      
      // Use the updateUserSettings thunk
      const result = await dispatch(updateUserSettings(settingsData));
      
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error(result.payload?.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Error saving settings');
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
                Location & Shipping
              </CardTitle>
              <CardDescription>
                Configure your base location and manage zone-based shipping settings
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
                
                {/* Shipping Zone Management */}
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <h3 className="text-md font-medium flex items-center mb-4">
                    <Map className="mr-2 h-5 w-5 text-blue-500" />
                    Zone-Based Shipping Management
                  </h3>
                  
                  <p className="text-sm text-blue-700 mb-4">
                    Set up custom shipping zones and rates for different regions. This gives you complete control over your shipping costs and allows for precise pricing based on delivery location.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <span>✓</span>
                      <span>Create unlimited shipping zones</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <span>✓</span>
                      <span>Set different rates for each region</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <span>✓</span>
                      <span>Weight and price-based rate adjustments</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <a 
                      href="/admin/shipping-zones" 
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                      <Map className="mr-2 h-4 w-4" />
                      Manage Shipping Zones
                    </a>
                  </div>
                </div>
                
                {/* Shipping Preferences Section */}
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <h3 className="text-md font-medium flex items-center mb-4">
                    <Truck className="mr-2 h-5 w-5 text-green-500" />
                    Shipping Rate Preferences
                  </h3>
                  
                  <p className="text-sm text-green-700 mb-4">
                    Set your default shipping rates. These will be used automatically for all orders based on customer location.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Default Fallback Rate (GHS)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={shippingPreferences.defaultBaseRate}
                        min="0"
                        step="0.01"
                        className="bg-white"
                        onChange={(e) => setShippingPreferences(prev => ({
                          ...prev,
                          defaultBaseRate: parseFloat(e.target.value) || 0
                        }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Used when no specific region rates are configured in Shipping Zones</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
                    <strong>💡 Tip:</strong> Configure specific rates for each region in the "Shipping Zones" section. 
                    This fallback rate is only used when no specific zone is configured for a customer's region.
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Location Settings
                      </>
                    )}
                  </button>
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