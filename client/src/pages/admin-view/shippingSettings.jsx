import React from 'react';
import { useSelector } from 'react-redux';
import ShippingZones from '@/components/admin-view/shippingZones';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, MapPin } from 'lucide-react';

function AdminShippingSettings() {
  const { user } = useSelector((state) => state.auth);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shipping Settings</h1>
        <div className="flex items-center text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{user?.baseRegion || 'No base region set'}</span>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5 text-blue-500" />
            Multi-Vendor Shipping Configuration
          </CardTitle>
          <CardDescription>
            Set your base location and configure shipping rates for different regions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            As a vendor on our multi-vendor platform, you can set custom shipping rates based on your location.
            Customers in your region will receive discounted shipping rates compared to customers in other regions.
          </p>
        </CardContent>
      </Card>
      
      {/* Use the ShippingZones component which has all the needed functionality */}
      <ShippingZones />
    </div>
  );
}

export default AdminShippingSettings;
