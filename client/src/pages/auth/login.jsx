import SimpleForm from '@/components/common/SimpleForm';
import { loginFormControls } from '@/config';
import { loginUser } from '@/store/auth-slice';
import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import SimpleOAuthButtons from '@/components/auth/SimpleOAuthButtons';

const initialState = {
  email: '',
  password: ''
}

function AuthLogin() {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for redirect path in sessionStorage or query params
  useEffect(() => {
    // First check session storage
    const savedRedirectPath = sessionStorage.getItem('redirectAfterLogin');
    
    // Then check URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const redirectFromQuery = queryParams.get('redirect');
    const oauthError = queryParams.get('error');
    const oauthErrorMessage = queryParams.get('message');
    
    if (redirectFromQuery) {
      setRedirectPath(redirectFromQuery);
      // Save to session storage for persistence
      sessionStorage.setItem('redirectAfterLogin', redirectFromQuery);
    } else if (savedRedirectPath) {
      setRedirectPath(savedRedirectPath);
    }
    
    // Handle OAuth errors
    if (oauthError) {
      console.error('OAuth error received:', oauthError, oauthErrorMessage);
      const errorMessage = oauthErrorMessage || 'OAuth authentication failed. Please try again.';
      toast.error(errorMessage, {
        duration: 8000,
        description: 'You can try using OAuth again or login with email/password',
        action: {
          label: 'Dismiss',
          onClick: () => {
            // Clear error from URL
            const url = new URL(window.location);
            url.searchParams.delete('error');
            url.searchParams.delete('message');
            window.history.replaceState({}, '', url);
          },
        },
      });
      
      // Clear error from URL after showing toast
      setTimeout(() => {
        const url = new URL(window.location);
        url.searchParams.delete('error');
        url.searchParams.delete('message');
        window.history.replaceState({}, '', url);
      }, 1000);
    }
    
    // Log for debugging
    console.log('Redirect path after login:', redirectFromQuery || savedRedirectPath || 'None specified');
  }, [location]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
  
    try {
      const resultAction = await dispatch(loginUser(formData));
      
      if (loginUser.fulfilled.match(resultAction)) {
        if (resultAction.payload?.success) {
          const user = resultAction.payload.user;
          
          // Token is now automatically stored in Redux slice
          
          toast.success('Login Successful', {
            position: 'top-center',
            duration: 2000
          });
          
          // Navigate based on user role or redirect path
          if (user.role === 'admin') {
            navigate(redirectPath || '/admin/dashboard');
          } else if (user.role === 'superAdmin') {
            navigate(redirectPath || '/super-admin/dashboard');
          } else if (redirectPath) {
            // Clear the redirect path from session storage
            sessionStorage.removeItem('redirectAfterLogin');
            // Navigate back to the previous page
            navigate(redirectPath);
          } else {
            // Regular user with no redirect path
            navigate('/shop/home');
          }
        } else {
          toast.error(resultAction.payload?.message || 'Login failed', {
            duration: 4000,
            important: true,  // Makes toast more prominent
          });
        }
      } else if (loginUser.rejected.match(resultAction)) {
        toast.error(resultAction.payload?.message || 'Login failed', {
          duration: 5000,
          description: 'Please check your credentials',
          action: {
            label: 'Retry',
            onClick: () => onSubmit(event),
          },
          // Either use richColors + destructive OR custom classes
          richColors: true,
          destructive: true
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred', {
        classNames: {
          toast: 'bg-red-600 text-white border-red-700',
        },
        duration: 6000,
        action: {
          label: 'Report',
          onClick: () => window.open('/contact'),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-0 lg:space-y-8 flex flex-col h-full lg:h-auto">
      {/* Close button for mobile - goes to shop home */}
      <div className="flex justify-between items-center lg:hidden mb-6">
        <div></div>
        <h2 className="text-xl font-semibold">Come on in</h2>
        <Link to="/shop/home" className="text-2xl text-gray-500 hover:text-gray-700 transition-colors">×</Link>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-8 lg:mb-6">
        <div className="flex-1 text-center">
          <div className="text-gray-900 border-b-2 border-black pb-2 font-medium">
            SIGN IN
          </div>
        </div>
        <div className="flex-1 text-center">
          <Link to="/auth/register" className="text-gray-500 pb-2 font-medium block hover:text-gray-700">
            I'M NEW HERE
          </Link>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center lg:justify-start space-y-6">
        <SimpleForm 
          formControls={loginFormControls}
          buttonText={isLoading ? 'Signing In...' : 'Sign In'}
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          disabled={isLoading}
          isAuthForm={true}
        />
        
        {/* OR divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>
        
        <SimpleOAuthButtons />
        
        {/* Terms and conditions */}
        <div className="text-sm text-gray-600 text-center lg:text-left">
          By signing in, you agree to our{' '}
          <Link to="/shop/terms-of-service" className="underline hover:text-gray-900">Terms & Conditions</Link>,{' '}
          <Link to="/shop/privacy-policy" className="underline hover:text-gray-900">Privacy and Cookie Policy</Link>, and to join our loyalty programme
        </div>
        
        {/* Forgot password link - moved to bottom */}
        <div className="text-center mt-6">
          <Link 
            to="/auth/forgot-password"
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AuthLogin;