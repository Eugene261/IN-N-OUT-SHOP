import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import accountImage from '../../assets/account.jpg'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Address from '@/components/shopping-view/address';
import ShoppingOrders from '@/components/shopping-view/orders';
import ProfileInformation from '@/components/shopping-view/profile-information';
import PasswordChange from '@/components/shopping-view/password-change';
import UserSettings from '@/components/shopping-view/user-settings';
import AdminUserManagement from '@/components/admin-view/user-management';

function ShoppingAccount() {
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';

  // Backup authentication check - redirect if not authenticated
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      toast.error('Please sign in to access your account', {
        description: 'You need to be logged in to view this page'
      });
      navigate('/auth/login');
    }
  }, [isAuthenticated, user, navigate, isLoading]);

  // Don't render anything while loading or if not authenticated
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col '>
      <div className="relative h-[350px] w-full overflow-hidden">
        <img 
        src={accountImage}
        className='h-full w-full object-cover object-center'
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="text-center text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">My Account</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-90">Manage your profile and account settings</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto grid grid-cols-1 gap-6 sm:gap-8 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col rounded-lg border bg-background p-4 sm:p-6 shadow-sm">
          <Tabs defaultValue='profile' >
            <TabsList className="flex flex-wrap w-full gap-1 h-auto p-1">
              <TabsTrigger value='profile' className='cursor-pointer text-xs sm:text-sm px-2 py-2 flex-1 min-w-0'>Profile</TabsTrigger>
              <TabsTrigger value='password' className='cursor-pointer text-xs sm:text-sm px-2 py-2 flex-1 min-w-0'>Password</TabsTrigger>
              <TabsTrigger value='settings' className='cursor-pointer text-xs sm:text-sm px-2 py-2 flex-1 min-w-0'>Settings</TabsTrigger>
              <TabsTrigger value='orders' className='cursor-pointer text-xs sm:text-sm px-2 py-2 flex-1 min-w-0'>Orders</TabsTrigger>
              <TabsTrigger value='address' className='cursor-pointer text-xs sm:text-sm px-2 py-2 flex-1 min-w-0'>Address</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value='users' className='cursor-pointer text-xs sm:text-sm px-2 py-2 flex-1 min-w-0'>Users</TabsTrigger>
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