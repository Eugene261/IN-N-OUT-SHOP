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
    
    if (redirectFromQuery) {
      setRedirectPath(redirectFromQuery);
      // Save to session storage for persistence
      sessionStorage.setItem('redirectAfterLogin', redirectFromQuery);
    } else if (savedRedirectPath) {
      setRedirectPath(savedRedirectPath);
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
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link className='font-medium text-gray-900 hover:underline' to='/auth/register'>
            Sign up
          </Link>
        </p>
      </div>
      
      <SimpleForm 
        formControls={loginFormControls}
        buttonText={isLoading ? 'Signing In...' : 'Sign In'}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        disabled={isLoading}
        isAuthForm={true}
      />
      
      <SimpleOAuthButtons />
      
      <div className="text-center">
        <Link 
          to="/auth/forgot-password"
          className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
    </div>
  );
}

export default AuthLogin;