import SimpleForm from '@/components/common/SimpleForm';
import { registerFormControls } from '@/config';
import { registerUser } from '@/store/auth-slice';
import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SimpleOAuthButtons from '@/components/auth/SimpleOAuthButtons';

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
    <div className="w-full space-y-0 lg:space-y-8 flex flex-col h-full lg:h-auto">
      {/* Close button for mobile - goes to shop home */}
      <div className="flex justify-between items-center lg:hidden mb-6">
        <div></div>
        <h2 className="text-xl font-semibold">Great to have you here</h2>
        <Link to="/shop/home" className="text-2xl text-gray-500 hover:text-gray-700 transition-colors">×</Link>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-8 lg:mb-6">
        <div className="flex-1 text-center">
          <Link to="/auth/login" className="text-gray-500 pb-2 font-medium block hover:text-gray-700">
            SIGN IN
          </Link>
        </div>
        <div className="flex-1 text-center">
          <div className="text-gray-900 border-b-2 border-black pb-2 font-medium">
            I'M NEW HERE
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center lg:justify-start space-y-6">
        <SimpleForm 
          formControls={registerFormControls}
          buttonText={isLoading ? 'Creating Account...' : 'Register'}
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
        
        {/* Terms and conditions with checkbox */}
        <div className="flex items-start space-x-3">
          <input type="checkbox" id="terms" className="mt-1 h-4 w-4 text-black border-gray-300 rounded focus:ring-black" defaultChecked />
          <label htmlFor="terms" className="text-sm text-gray-600">
            Sign up and never miss out on exclusive member rewards, tailored new arrivals and new launches. Unsubscribe at the bottom of our emails.{' '}
            <Link to="/shop/about-us" className="underline hover:text-gray-900">Find out more</Link>
          </label>
        </div>
        
        <div className="text-sm text-gray-600 text-center lg:text-left">
          By registering, you agree to our{' '}
          <Link to="/shop/terms-of-service" className="underline hover:text-gray-900">Terms & Conditions</Link>,{' '}
          <Link to="/shop/privacy-policy" className="underline hover:text-gray-900">Privacy and Cookie Policy</Link>, and to join our loyalty programme
        </div>
      </div>
    </div>
  );
};

export default AuthRegister;