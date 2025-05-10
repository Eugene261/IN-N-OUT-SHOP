import CommonForm from '@/components/common/form';
import { loginFormControls } from '@/config';
import { loginUser } from '@/store/auth-slice';
import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const initialState = {
  email: '',
  password: ''
}

function AuthLogin() {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
  
    try {
      const resultAction = await dispatch(loginUser(formData));
      
      if (loginUser.fulfilled.match(resultAction)) {
        if (resultAction.payload?.success) {
          const user = resultAction.payload.user;
          
          toast.success('Login Successful', {
            position: 'top-center',
            duration: 2000
          });
          
          // Navigate based on user role
          if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (user.role === 'superAdmin') {
            navigate('/super-admin/dashboard');
          } else {
            // Regular user
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
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h1>
        <p className="mt-2">Don't have an account?
          <Link className='font-medium ml-2 text-blue-800 hover:underline' 
          to='/auth/register'>
            Register
          </Link>
        </p>
      </div>
      <CommonForm 
        formControls={loginFormControls}
        buttonText={isLoading ? 'Signing In...' : 'Sign In'}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        disabled={isLoading}
      />
    </div>
  );
}

export default AuthLogin;