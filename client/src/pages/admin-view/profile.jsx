import React from 'react'
import { useSelector } from 'react-redux'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminProfileInformation from '@/components/admin-view/admin-profile-information';
import AdminPasswordChange from '@/components/admin-view/admin-password-change';
import AdminUserSettings from '@/components/admin-view/admin-user-settings';
import AdminUserManagement from '@/components/admin-view/user-management';
import { User, Shield, Settings, Lock, Users, Crown } from 'lucide-react';

function AdminProfile() {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'superAdmin';
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-shrink-0 self-center sm:self-start">
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-4 border-gray-200"
                      src={user.avatar}
                      alt={`${user.firstName || user.userName}'s avatar`}
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200">
                      <span className="text-lg sm:text-2xl font-bold text-white">
                        {(user?.firstName || user?.userName || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-gray-200">
                    {isSuperAdmin ? (
                      <Crown className="h-3 w-3 sm:h-5 sm:w-5 text-yellow-500" />
                    ) : (
                      <Shield className="h-3 w-3 sm:h-5 sm:w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.userName || 'Admin User'}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
                  <div className="flex items-center justify-center sm:justify-start space-x-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isSuperAdmin 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isSuperAdmin ? (
                        <>
                          <Crown className="mr-1 h-3 w-3" />
                          <span className="hidden sm:inline">Super Administrator</span>
                          <span className="sm:hidden">Super Admin</span>
                        </>
                      ) : (
                        <>
                          <Shield className="mr-1 h-3 w-3" />
                          <span className="hidden sm:inline">Administrator</span>
                          <span className="sm:hidden">Admin</span>
                        </>
                      )}
                    </span>
                  </div>
                  {user?.email && (
                    <span className="truncate text-center sm:text-left">{user.email}</span>
                  )}
                  {user?.lastLogin && (
                    <span className="text-center sm:text-left">
                      <span className="hidden sm:inline">Last login: </span>
                      <span className="sm:hidden">Last: </span>
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <Tabs defaultValue='profile' className="w-full">
            <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-0`}>
              <TabsTrigger value='profile' className='cursor-pointer flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4'>
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value='password' className='cursor-pointer flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4'>
                <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Password</span>
              </TabsTrigger>
              <TabsTrigger value='settings' className='cursor-pointer flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4'>
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Settings</span>
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value='users' className='cursor-pointer flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4'>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Users</span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="p-4 sm:p-6">
              <TabsContent value='profile' className="mt-0">
                <AdminProfileInformation />
              </TabsContent>
              
              <TabsContent value='password' className="mt-0">
                <AdminPasswordChange />
              </TabsContent>
              
              <TabsContent value='settings' className="mt-0">
                <AdminUserSettings />
              </TabsContent>
              
              {isSuperAdmin && (
                <TabsContent value='users' className="mt-0">
                  <AdminUserManagement />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default AdminProfile; 