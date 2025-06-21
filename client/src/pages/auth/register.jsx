import CommonForm from '@/components/common/form';
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
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign Up</h1>
        <p className="mt-2">
          Already have an account?
          <Link 
            className='font-medium ml-2 text-blue-800 hover:underline' 
            to='/auth/login'
          >
            Login
          </Link>
        </p>
      </div>
      <CommonForm 
        formControls={registerFormControls}
        buttonText={isLoading ? 'Signing Up...' : 'Sign Up'}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        disabled={isLoading}
      />
      
      {/* OAuth Buttons */}
      <OAuthButtons />
    </div>
  );
};

export default AuthRegister;