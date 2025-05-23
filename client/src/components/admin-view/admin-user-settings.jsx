import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserSettings } from '@/store/auth-slice';
import { 
  DollarSign, 
  Shield, 
  Crown, 
  Building, 
  User,
  Clock,
  Truck
} from 'lucide-react';

function AdminUserSettings() {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = user?.role === 'superAdmin';
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';

  

    const formatPrice = (price) => {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Shield className="w-4 h-4" />
                Role & Permissions
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Account Type:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isSuperAdmin 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isSuperAdmin ? (
                      <>
                        <Crown className="mr-1 h-3 w-3" />
                        Super Administrator
                      </>
                    ) : (
                      <>
                        <Shield className="mr-1 h-3 w-3" />
                        Administrator
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Clock className="w-4 h-4" />
                Activity Information
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Last Login:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(user?.lastLogin)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Account Created:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(user?.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Building className="w-4 h-4" />
                Business Information
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Base Location:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.baseCity && user?.baseRegion 
                      ? `${user.baseCity}, ${user.baseRegion}`
                      : 'Not set'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Shop Name:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.shopName || 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Financial Overview */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatPrice(user?.totalEarnings || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Current Balance</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatPrice(user?.balance || 0)}
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Withdrawn</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatPrice(user?.totalEarningsWithdrawn || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Shipping Fees</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatPrice(user?.totalShippingFees || 0)}
                    </p>
                  </div>
                  <Truck className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      

      {/* SuperAdmin Only Section */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Super Administrator Settings
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Advanced settings and system-wide configurations available only to super administrators.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium mb-1">Super Administrator Privileges:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Manage all user accounts and permissions</li>
                      <li>Access system-wide analytics and reports</li>
                      <li>Configure platform settings and features</li>
                      <li>Manage vendor payments and financial settings</li>
                      <li>Access to all administrative functions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">System Access</h4>
                  <p className="text-sm text-gray-600">
                    Full administrative access to all platform features and user management.
                  </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Global Settings</h4>
                  <p className="text-sm text-gray-600">
                    Configure system-wide settings, features, and platform behavior.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminUserSettings; 