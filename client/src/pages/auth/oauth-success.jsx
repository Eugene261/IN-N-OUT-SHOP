import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkAuth, setLoading } from '@/store/auth-slice';
import { toast } from 'sonner';
import ShoppingLoader from '@/components/common/ShoppingLoader';
import { migrateGuestWishlist } from '@/store/shop/wishlist-slice';

const OAuthSuccess = () => {
  console.log('🚀 OAuthSuccess component rendered');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  // Only render if we're actually on the oauth-success route
  if (window.location.pathname !== '/auth/oauth-success') {
    console.log('OAuthSuccess: Not on correct route, not rendering');
    return null;
  }

  // Get token from URL to check if this is a valid OAuth callback
  const token = searchParams.get('token');
  if (!token) {
    console.log('OAuthSuccess: No token in URL, redirecting to login');
    navigate('/auth/login', { replace: true });
    return null;
  }

  useEffect(() => {
    // Only run if we're actually on the oauth-success route
    if (window.location.pathname !== '/auth/oauth-success') {
      console.log('Not on oauth-success route, skipping processing');
      return;
    }

    // Check if OAuth processing is already in progress globally
    const oauthProcessing = localStorage.getItem('oauth_processing');
    if (oauthProcessing === 'true') {
      console.log('OAuth processing already in progress globally, skipping');
      return;
    }

    // Prevent multiple executions
    if (hasProcessed.current) {
      console.log('OAuth processing already completed, skipping');
      return;
    }

    const processOAuthSuccess = async () => {
      try {
        hasProcessed.current = true; // Mark as processed to prevent re-execution
        localStorage.setItem('oauth_processing', 'true'); // Set global flag
        
        console.log('=== OAuthSuccess Component Started ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', searchParams.toString());
        
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        
        console.log('Token from URL:', token ? 'Present' : 'Missing');
        console.log('Error from URL:', error);

        if (error) {
          console.error('OAuth error from URL:', error);
          toast.error('Authentication failed. Please try again.');
          dispatch(setLoading(false)); // Clear loading state
          hasProcessed.current = false; // Reset flag on error
          localStorage.removeItem('oauth_processing'); // Clear global flag
          window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
          navigate('/auth/login');
          return;
        }

        if (!token) {
          console.error('No token found in URL parameters');
          toast.error('No authentication token received.');
          dispatch(setLoading(false)); // Clear loading state
          hasProcessed.current = false; // Reset flag on error
          localStorage.removeItem('oauth_processing'); // Clear global flag
          window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
          navigate('/auth/login');
          return;
        }

        // Store token in localStorage
        localStorage.setItem('token', token);
        console.log('OAuth Success: Token stored in localStorage');

        // Dispatch checkAuth to validate and set authentication state
        const authResult = await dispatch(checkAuth()).unwrap();
        console.log('OAuth Success: checkAuth result:', authResult);

        if (!authResult.success) {
          throw new Error('Authentication validation failed');
        }

        // Get user data from auth result
        const userData = authResult.user;

        // Migrate guest wishlist if exists
        const guestId = localStorage.getItem('guestId');
        if (guestId && userData) {
          try {
            await dispatch(migrateGuestWishlist({ 
              userId: userData._id || userData.id, 
              guestId 
            })).unwrap();
            
            // Clean up guest data
            localStorage.removeItem('guestId');
            toast.success('Your wishlist has been preserved!');
          } catch (migrationError) {
            console.error('Failed to migrate guest wishlist:', migrationError);
            // Don't fail the login for wishlist migration issues
          }
        }

        // Success toast
        toast.success(`Welcome${userData?.userName ? `, ${userData.userName}` : ''}!`);

        // Role-based redirection
        let redirectUrl;
        const intendedUrl = sessionStorage.getItem('redirectAfterLogin');
        
        if (userData?.role === 'superAdmin') {
          redirectUrl = '/super-admin/dashboard';
          console.log('OAuth Success: SuperAdmin user, redirecting to super-admin dashboard');
        } else if (userData?.role === 'admin') {
          redirectUrl = '/admin/dashboard';
          console.log('OAuth Success: Admin user, redirecting to admin dashboard');
        } else {
          // For regular users, use intended URL or default to shop home
          redirectUrl = intendedUrl || '/shop/home';
          console.log('OAuth Success: Regular user, redirecting to shop');
        }
        
        // Clear the intended redirect URL
        sessionStorage.removeItem('redirectAfterLogin');
        
        console.log('OAuth Success: Final redirect URL:', redirectUrl);
        
        // Clean up URL parameters before redirecting
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Clear OAuth processing flag
        localStorage.removeItem('oauth_processing');
        
        // Redirect immediately
        navigate(redirectUrl, { replace: true });

      } catch (error) {
        console.error('OAuth processing error:', error);
        toast.error('Authentication processing failed. Please try again.');
        dispatch(setLoading(false)); // Ensure loading state is cleared on error
        hasProcessed.current = false; // Reset flag on error to allow retry
        localStorage.removeItem('oauth_processing'); // Clear global flag
        window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
        navigate('/auth/login');
      }
    };

    processOAuthSuccess();
    
    // Cleanup function to reset the flag if component unmounts
    return () => {
      hasProcessed.current = false;
      localStorage.removeItem('oauth_processing');
    };
  }, []); // Empty dependency array to run only once

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ShoppingLoader />
        <h2 className="mt-6 text-lg font-medium text-gray-900">
          Completing your sign in...
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  );
};

export default OAuthSuccess; 