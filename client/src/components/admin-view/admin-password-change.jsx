import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Lock, Shield, Check, X, AlertTriangle } from 'lucide-react';

function AdminPasswordChange() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const getPasswordStrength = (password) => {
    const requirements = validatePassword(password);
    const score = Object.values(requirements).filter(Boolean).length;
    
    if (score < 3) return { strength: 'weak', color: 'text-red-500', bg: 'bg-red-100' };
    if (score < 5) return { strength: 'medium', color: 'text-yellow-500', bg: 'bg-yellow-100' };
    return { strength: 'strong', color: 'text-green-500', bg: 'bg-green-100' };
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    const passwordValidation = validatePassword(passwords.newPassword);
    if (!passwordValidation.length || !passwordValidation.uppercase || !passwordValidation.lowercase || !passwordValidation.number || !passwordValidation.special) {
      toast({
        title: 'Error',
        description: 'Password must meet all security requirements',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to change admin password...');
      
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();
      console.log('Admin password change response:', data);

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Password changed successfully! Please use your new password when logging in.',
          variant: 'default'
        });
        // Reset form
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        console.log('Admin password changed successfully and form reset');
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Admin password change error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = validatePassword(passwords.newPassword);
  const passwordStrength = getPasswordStrength(passwords.newPassword);

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Change Admin Password
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Update your admin account password. Ensure you use a strong password to protect your administrative access.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-6">
            {/* Admin Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Admin Account Security Notice:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Admin passwords require enhanced security (minimum 8 characters)</li>
                    <li>Your password protects administrative functions and user data</li>
                    <li>Consider using a password manager for optimal security</li>
                    <li>You will be logged out after changing your password</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Current Admin Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your current admin password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Admin Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your new admin password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {passwords.newPassword && (
                <div className="space-y-2">
                  <div className={`text-sm font-medium ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                  </div>
                  
                  {/* Enhanced Password Requirements for Admin */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {passwordRequirements.length ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}>
                        At least 8 characters (admin requirement)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordRequirements.uppercase ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}>
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordRequirements.lowercase ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}>
                        One lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordRequirements.number ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}>
                        One number
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordRequirements.special ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={passwordRequirements.special ? 'text-green-600' : 'text-gray-500'}>
                        One special character (!@#$%^&* etc.)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new admin password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  Passwords do not match
                </p>
              )}
              {passwords.confirmPassword && passwords.newPassword === passwords.confirmPassword && (
                <p className="text-green-500 text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Admin Security Best Practices */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-500 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium mb-1">Admin Security Best Practices:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Use a unique password not used on any other platform</li>
                    <li>Include a mix of uppercase, lowercase, numbers, and special characters</li>
                    <li>Avoid using personal information in your password</li>
                    <li>Consider using a password manager for enhanced security</li>
                    <li>Change your password regularly (every 90 days recommended)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={
                  loading || 
                  passwords.newPassword !== passwords.confirmPassword || 
                  !passwords.currentPassword ||
                  !passwordRequirements.length ||
                  !passwordRequirements.uppercase ||
                  !passwordRequirements.lowercase ||
                  !passwordRequirements.number ||
                  !passwordRequirements.special
                }
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Change Admin Password
                  </>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPasswordChange; 