import React from 'react'
import { useSelector } from 'react-redux'
import accountImage from '../../assets/account.jpg'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Address from '@/components/shopping-view/address';
import ShoppingOrders from '@/components/shopping-view/orders';
import ProfileInformation from '@/components/shopping-view/profile-information';
import PasswordChange from '@/components/shopping-view/password-change';
import UserSettings from '@/components/shopping-view/user-settings';
import AdminUserManagement from '@/components/admin-view/user-management';

function ShoppingAccount() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';

  return (
    <div className='flex flex-col '>
      <div className="relative h-[350px] w-full overflow-hidden">
        <img 
        src={accountImage}
        className='h-full w-full object-cover object-center'
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">My Account</h1>
            <p className="text-lg opacity-90">Manage your profile and account settings</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto grid grid-cols-1 gap-8 py-8">
        <div className="flex flex-col rounded-lg border bg-background p-6 shadow-sm">
          <Tabs defaultValue='profile' >
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              <TabsTrigger value='profile' className='cursor-pointer'>Profile</TabsTrigger>
              <TabsTrigger value='password' className='cursor-pointer'>Password</TabsTrigger>
              <TabsTrigger value='settings' className='cursor-pointer'>Settings</TabsTrigger>
              <TabsTrigger value='orders' className='cursor-pointer'>Orders</TabsTrigger>
              <TabsTrigger value='address' className='cursor-pointer'>Address</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value='users' className='cursor-pointer'>Users</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value='profile' className="mt-6">
                <ProfileInformation />
            </TabsContent>
            
            <TabsContent value='password' className="mt-6">
                <PasswordChange />
            </TabsContent>
            
            <TabsContent value='settings' className="mt-6">
                <UserSettings />
            </TabsContent>
            
            <TabsContent value='orders' className="mt-6">
                <ShoppingOrders/>
            </TabsContent>
            
            <TabsContent value='address' className="mt-6">
                <Address />
            </TabsContent>
            
            {isAdmin && (
              <TabsContent value='users' className="mt-6">
                  <AdminUserManagement />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default ShoppingAccount;