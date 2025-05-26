// App.jsx
import { Routes, Route } from "react-router-dom";
import AuthLayout from "./components/auth/layout";import AuthLogin from "./pages/auth/login";import AuthRegister from "./pages/auth/register";import ForgotPassword from "./pages/auth/forgot-password";import ResetPassword from "./pages/auth/reset-password";
import AdminLayout from "./components/admin-view/layout";
import AdminProducts from "./pages/admin-view/products";
import AdminDashboard from "./pages/admin-view/dashboard";
import AdminOrders from "./pages/admin-view/orders";
import AdminFeatures from "./pages/admin-view/features";
import AdminFeaturedProducts from "./pages/admin-view/featuredProducts";
import AdminShippingSettings from "./pages/admin-view/shippingSettings";
import AdminProfile from "./pages/admin-view/profile";
import AdminSettingsPage from "./pages/admin-view/settings";
import ShoppingLayout from "./components/shopping-view/layout";
import NotFound from "./pages/not-found";
import ShoppingHome from "./pages/shopping-view/home";
import ShoppingListing from "./pages/shopping-view/listing";
import ShoppingCheckout from "./pages/shopping-view/checkout";
import ShoppingAccount from "./pages/shopping-view/account";
import CheckAuth from "./components/common/checkAuth";
import UnauthPage from "./pages/unauth-page";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { checkAuth } from "./store/auth-slice";
import ShoppingLoader from "./components/common/ShoppingLoader";
// PayPal import removed
import OrderConfirmationPage from "./pages/shopping-view/orderConfirmation";
import SearchProducts from "./components/shopping-view/search";import WishlistPage from "./pages/shopping-view/wishlist";import TermsOfService from "./pages/shopping-view/termsOfService";import PrivacyPolicy from "./pages/shopping-view/privacyPolicy";import CookiePolicy from "./pages/shopping-view/cookiePolicy";import ProductDetailsPage from "./pages/shopping-view/productDetailsPage";import ShippingPage from "./pages/shopping-view/shipping";import ShopsDirectory from "./pages/shopping-view/shops";

// Import new pages
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import FAQs from "./pages/FAQs";
import Features from "./pages/Features";


// SuperAdmin imports
import SuperAdminLayout from "./components/super-admin-view/superAdminLayout";
import SuperAdminDashboardPage from "./pages/super-admin-view/dashboard";
import SuperAdminUsersPage from "./pages/super-admin-view/users";
import SuperAdminOrdersPage from "./pages/super-admin-view/orders";
import SuperAdminProductsPage from "./pages/super-admin-view/products";
import SuperAdminFeaturedPage from "./pages/super-admin-view/featured";
import SuperAdminVendorPaymentsPage from "./pages/super-admin-view/vendorPayments";
import SuperAdminProfile from "./pages/super-admin-view/profile";import TaxonomyManagement from "./pages/superAdmin-view/TaxonomyManagement";

// Admin vendor payments
import AdminVendorPaymentsPage from "./pages/admin-view/vendorPayments";

// Import ConnectionStatus component
import ConnectionStatus from "./components/shared/ConnectionStatus";

// Import TokenManager component
import TokenManager from './components/common/TokenManager';

// Import Toaster component
import { Toaster } from "./components/ui/sonner";

// Import axios interceptor
import setupAxiosInterceptors from "./utils/axiosInterceptor";

function App() {
  const {user, isAuthenticated, isLoading } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // Setup axios interceptors for token expiration handling
    setupAxiosInterceptors();
    
    console.log('App: Dispatching checkAuth...');
    dispatch(checkAuth());
    
    // Add a timeout safeguard to prevent permanent loading state
    const timeout = setTimeout(() => {
      console.warn('Authentication check took too long, forcing loading to false');
      // If still loading after 10 seconds, there might be an issue
      if (isLoading) {
        console.error('App stuck in loading state for too long');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [dispatch]);

  // Add debugging for loading state
  useEffect(() => {
    console.log('App loading state changed:', { isLoading, isAuthenticated, user: !!user });
  }, [isLoading, isAuthenticated, user]);

  if(isLoading) {
    console.log('App: Showing loading screen');
    return (
      <div className="flex items-center justify-center h-screen">
        <ShoppingLoader />
      </div>
    );
  }

  return (
    <>
      <TokenManager />
      <div className="flex flex-col overflow-hidden bg-white">
        <ConnectionStatus />
        <Routes>
          {/* AUTH */}
          <Route 
            path="/"
            element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <AuthLayout/>
              </CheckAuth>
            }
          />
                              <Route path='/auth' element={            <CheckAuth isAuthenticated={isAuthenticated} user={user}>              <AuthLayout/>            </CheckAuth>          }>            <Route path='login' element={<AuthLogin />} />            <Route path='register' element={<AuthRegister />} />            <Route path='forgot-password' element={<ForgotPassword />} />            <Route path='reset-password/:token' element={<ResetPassword />} />          </Route>

          {/* ADMIN */}
          <Route path='/admin' element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user} requiredRole="admin">
              <AdminLayout/>
            </CheckAuth>
          }>
            <Route path='dashboard' element={<AdminDashboard />} />
            <Route path='products' element={<AdminProducts />} />
            <Route path='orders' element={<AdminOrders />} />
            <Route path='features' element={<AdminFeatures />} />
            <Route path='featured-products' element={<AdminFeaturedProducts />} />
            <Route path='shipping-settings' element={<AdminShippingSettings />} />
            <Route path='vendor-payments' element={<AdminVendorPaymentsPage />} />
            <Route path='settings' element={<AdminSettingsPage />} />
            <Route path='profile' element={<AdminProfile />} />
          </Route>

          {/* SUPER ADMIN */}
          <Route path='/super-admin' element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user} requiredRole="superAdmin">
              <SuperAdminLayout/>
            </CheckAuth>
          }>
            <Route path='dashboard' element={<SuperAdminDashboardPage />} />
            <Route path='users' element={<SuperAdminUsersPage />} />
            <Route path='orders' element={<SuperAdminOrdersPage />} />
            <Route path='products' element={<SuperAdminProductsPage />} />
                        <Route path='featured' element={<SuperAdminFeaturedPage />} />            <Route path='taxonomy' element={<TaxonomyManagement />} />            <Route path='vendor-payments' element={<SuperAdminVendorPaymentsPage />} />            <Route path='profile' element={<SuperAdminProfile />} />
          </Route>

                    {/* SHOP */}          <Route path='/shop' element={<ShoppingLayout />}>            <Route path='' element={<ShoppingHome />} />            <Route path='home' element={<ShoppingHome />} />            <Route path='listing' element={<ShoppingListing />} />            <Route path='shops' element={<ShopsDirectory />} />            <Route path='search' element={<SearchProducts />} />            <Route path='product/:productId' element={<ProductDetailsPage />} />
            
            {/* Routes that require authentication */}
            <Route path='checkout' element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <ShoppingCheckout />
              </CheckAuth>
            } />
            {/* PayPal return route removed */}
            <Route path='order-confirmation' element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <OrderConfirmationPage />
              </CheckAuth>
            } />
            <Route path='account' element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <ShoppingAccount />
              </CheckAuth>
            } />
            <Route path='account/orders' element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <ShoppingAccount />
              </CheckAuth>
            } />
            <Route path='account/profile' element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <ShoppingAccount />
              </CheckAuth>
            } />
            <Route path='wishlist' element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <WishlistPage />
              </CheckAuth>
            } />

            {/* Information Pages */}
            <Route path="contact-us" element={<ContactUs />} />
            <Route path="about-us" element={<AboutUs />} />
            <Route path="faqs" element={<FAQs />} />
            <Route path="features" element={<Features />} />
            <Route path="shipping" element={<ShippingPage />} />
            
            
            {/* Product Details Page */}
            <Route path="product/:productId" element={<ProductDetailsPage />} />
            
            {/* Policy Pages */}
            <Route path="terms-of-service" element={<TermsOfService />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="cookie-policy" element={<CookiePolicy />} />
          </Route>

          {/* Not Found */}
          <Route path="*" element={<NotFound/>} />

          {/* Unauth-Page */}
          <Route path="unauth-page" element={<UnauthPage/>} />
        </Routes>
      </div>
      <Toaster />
    </>
  );
}

export default App;
