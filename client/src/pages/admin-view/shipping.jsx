import React from 'react';
import ShippingZones from '@/components/admin-view/shippingZones';

function AdminShippingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shipping Management</h1>
      <ShippingZones />
    </div>
  );
}

export default AdminShippingPage; 