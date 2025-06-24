import SimpleForm from '@/components/common/SimpleForm';
import { registerFormControls } from '@/config';
import { registerUser } from '@/store/auth-slice';
import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import OAuthButtons from '@/components/auth/OAuthButtons';

const initialState = {
  userName: '',
  email: '',
  password: ''
}

function AuthRegister() {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const resultAction = await dispatch(registerUser(formData));
      
      if (registerUser.fulfilled.match(resultAction)) {
        toast.success('Registration Successful');
        navigate('/auth/login');
      } else if (registerUser.rejected.match(resultAction)) {
        // Show the error message from the server
        toast.error(resultAction.payload?.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link 
            className='font-medium text-gray-900 hover:underline' 
            to='/auth/login'
          >
            Sign in
          </Link>
        </p>
      </div>
      <SimpleForm 
        formControls={registerFormControls}
        buttonText={isLoading ? 'Creating Account...' : 'Create Account'}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        disabled={isLoading}
        isAuthForm={true}
      />
      
      <OAuthButtons />
    </div>
  );
};

export default AuthRegister;