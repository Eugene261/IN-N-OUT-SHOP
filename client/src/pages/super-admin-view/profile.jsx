import React from 'react';
import SuperAdminProfileInformation from '../../components/super-admin-view/superAdminProfileInformation';

function SuperAdminProfile() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Profile</h1>
        <p className="text-gray-600 mt-1">Manage your superAdmin account and preferences</p>
      </div>
      
      <SuperAdminProfileInformation />
    </div>
  );
}

export default SuperAdminProfile; 