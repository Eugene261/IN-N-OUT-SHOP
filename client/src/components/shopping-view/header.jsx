import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { HousePlus, Menu, ShoppingBag, UserRound, LogOut, Heart, ChevronDown, ShoppingCart } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../ui/sheet';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { shoppingViewHeaderMenuItems } from '@/config';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { logoutUser } from '@/store/auth-slice';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import UserCartItemsContent from './cartItemsContent';
import UserCartWraper from './cartWrapper';
import { fetchCartItems, openCart, closeCart, toggleCart, clearCartState, clearCart } from '@/store/shop/cart-slice';
import { fetchWishlistItems } from '@/store/shop/wishlist-slice';
import { Label } from '../ui/label';
import MobileMenuAccordion from './MobileMenuAccordion';

function MenuItems({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHomePage = location.pathname === '/shop/home' || location.pathname === '/shop';
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  function handleNavigate(menuItem) {
    // Always navigate to the menu item's path when clicked
    if (menuItem.path) {
      // For items with category filtering
      if (menuItem.id !== 'home' && menuItem.id !== 'products' && menuItem.id !== 'search') {
        // Store the category filter in session storage
        sessionStorage.removeItem('filters');
        const currentFilter = {
          category: [menuItem.id]
        };
        sessionStorage.setItem('filters', JSON.stringify(currentFilter));
      }
      
      // Navigate to the path
      navigate(menuItem.path);
      
      // Call the onNavigate callback if provided (to close mobile menu)
      if (typeof onNavigate === 'function') {
        onNavigate();
      }
    }
    
    // Close the submenu after navigation
    setActiveSubmenu(null);
  }

  function handleSubmenuToggle(menuItemId) {
    setActiveSubmenu(activeSubmenu === menuItemId ? null : menuItemId);
  }
  
  function handleMouseEnter(menuItemId) {
    if (menuItemId) {
      setActiveSubmenu(menuItemId);
    }
  }
  
  function handleMouseLeave() {
    setActiveSubmenu(null);
  }
  
  function handleSubmenuItemClick(path, category) {
    // Close the submenu
    setActiveSubmenu(null);
    
    // Extract category information from the URL if available
    if (path.includes('?')) {
      const url = new URL(`http://example.com${path}`);
      const categoryParam = url.searchParams.get('category');
      const subCategoryParam = url.searchParams.get('subCategory');
      
      // Set filter in session storage for the listing page
      if (categoryParam) {
        sessionStorage.removeItem('filters');
        const currentFilter = {
          category: [categoryParam]
        };
        
        // Add subcategory if available
        if (subCategoryParam) {
          currentFilter.subCategory = [subCategoryParam];
        }
        
        sessionStorage.setItem('filters', JSON.stringify(currentFilter));
      }
    } 
    // If direct category is provided but no query params in URL
    else if (category) {
      sessionStorage.removeItem('filters');
      const currentFilter = {
        category: [category]
      };
      sessionStorage.setItem('filters', JSON.stringify(currentFilter));
    }
    
    // Navigate to the specified path
    navigate(path);
    
    // Call the onNavigate callback if provided (to close mobile menu)
    if (typeof onNavigate === 'function') {
      onNavigate();
    }
  }

  return (
    <div className="relative w-full">
      <nav className='flex flex-col lg:flex-row lg:items-center gap-0 w-full'>
        {shoppingViewHeaderMenuItems
          .filter(menuItem => !(isHomePage && menuItem.id === 'home'))
          .map((menuItem, index) => (
            <motion.div
              key={menuItem.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className='relative'
              onMouseEnter={() => window.innerWidth >= 1024 && menuItem.hasSubmenu && handleMouseEnter(menuItem.id)}
              onMouseLeave={() => window.innerWidth >= 1024 && handleMouseLeave()}
            >
              <div
                onClick={() => handleNavigate(menuItem)}
                className={cn(
                  'cursor-pointer text-sm font-medium uppercase tracking-wide transition-colors hover:bg-gray-100 px-5 py-4',
                  location.pathname.includes(menuItem.path) && menuItem.id !== 'home'
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-700'
                )}
              >
                <div className='flex items-center'>
                  {menuItem.label}
                  {menuItem.hasSubmenu && <ChevronDown className='ml-1 h-3 w-3' />}
                </div>
              </div>
            </motion.div>
          ))}
      </nav>
      
      {/* Mega Menu Dropdown - Positioned full width below the navigation */}
      {activeSubmenu && (
        <div 
          className="absolute left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200 w-full"
          style={{ top: '100%' }}
          onMouseEnter={() => setActiveSubmenu(activeSubmenu)}
          onMouseLeave={() => setActiveSubmenu(null)}
        >
          {shoppingViewHeaderMenuItems
            .filter(item => item.id === activeSubmenu && item.hasSubmenu)
            .map((menuItem, menuIndex) => (
              <div key={menuIndex} className="container mx-auto py-6 px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {menuItem.submenu.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
                        {section.title}
                      </h3>
                      <ul className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex}>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSubmenuItemClick(item.path, item.category || section.category);
                              }}
                              className="text-sm text-gray-600 hover:text-black transition-colors block py-1"
                            >
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function HeaderRightContent() {
  const { user } = useSelector(state => state.auth);
  const { cartItems, isCartOpen }  = useSelector(state => state.shopCart);
  const { wishlistItems } = useSelector(state => state.wishlist);
  
  // CRITICAL FIX: Ensure cartItems has the right structure
  const validCartItems = cartItems && cartItems.items ? cartItems.items : [];
  console.log('Cart items in header:', validCartItems);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function handleLogout() {
    dispatch(logoutUser());
  }

  useEffect(() => {
    if (user) {
      const userId = user.id || user._id;
      if (userId) {
        // Store the current user ID in localStorage for cart ownership validation
        localStorage.setItem('currentUserId', userId);
        localStorage.setItem('sessionActive', 'true');
        
        // Check if we're on the order confirmation page
        const isOrderConfirmationPage = window.location.pathname.includes('/shop/order-confirmation');
        
        // ONLY clear cart flags when not on the order confirmation page
        // This ensures cart persistence across normal page navigation
        if (!isOrderConfirmationPage) {
          // Only clear these flags when NOT on the order confirmation page
          // This helps maintain cart data across regular page navigation
          localStorage.removeItem('cartEmptyAfterOrder');
          sessionStorage.removeItem('cartEmptyAfterOrder');
          
          // Check if it's been more than 1 hour since order completion
          const lastCompletedOrderStr = localStorage.getItem('lastCompletedOrder');
          const lastCompletedOrder = lastCompletedOrderStr ? JSON.parse(lastCompletedOrderStr) : null;
          const orderCompletedRecently = lastCompletedOrder && 
                                (new Date().getTime() - lastCompletedOrder.timestamp < 3600000); // Within last hour
          
          if (!orderCompletedRecently) {
            // Normal page - fetch the cart normally
            console.log('Normal page navigation, fetching cart for user:', userId);
            dispatch(fetchCartItems(userId))
              .then((result) => {
                console.log('Cart fetch result:', result);
                // If we have a successful fetch but the cart is empty, try again once
                if (result.payload?.data?.items?.length === 0) {
                  setTimeout(() => {
                    console.log('Retry cart fetch after delay');
                    dispatch(fetchCartItems(userId));
                  }, 1000);
                }
              })
              .catch(err => {
                console.error('Error fetching cart:', err);
              });
              
            // Fetch wishlist items as well
            dispatch(fetchWishlistItems(userId));
          }
        } else {
          // We're on the order confirmation page
          console.log('On order confirmation page, not fetching cart');
          // Don't clear the wishlist or manipulate anything else on this page
        }
      }
    }
  }, [user, dispatch]);
  
  // Handle cart clean-up when component unmounts, especially important for logout
  useEffect(() => {
    return () => {
      if (!user) {
        // Clear cart data when user logs out
        localStorage.removeItem('sessionActive');
      }
    };
  }, [user]);
  
  // Separate effect for cart updates to prevent infinite loops
  useEffect(() => {
    // Intentionally empty to avoid dependency on cartItems
    // This decouples the cart fetching from wishlist fetching
  }, [cartItems]);

  return (
    <div className="flex items-center space-x-1">
      {/* Wishlist Button */}
      {user && (
        <Link to="/shop/wishlist">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-md hover:bg-gray-50 transition-all duration-200"
          >
            <Heart className={`w-5 h-5 ${wishlistItems?.length > 0 ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
            {wishlistItems?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium shadow-sm text-xs">
                {wishlistItems.length}
              </span>
            )}
          </motion.div>
        </Link>
      )}
      
      {/* Cart Button - Only shown when user is logged in */}
      {user && (
        <div className="relative">
          <Sheet open={isCartOpen} onOpenChange={(open) => open ? dispatch(openCart()) : dispatch(closeCart())}>
            <SheetTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer relative p-2 rounded-md hover:bg-gray-50 transition-all duration-200"
              >
                <ShoppingBag className='h-5 w-5 text-gray-900' />
                {cartItems?.items?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium shadow-sm">
                    {cartItems?.items?.length}
                  </span>
                )}
              </motion.div>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-full max-w-md">
              <SheetHeader className="sr-only">
                <SheetTitle>Shopping Cart</SheetTitle>
              </SheetHeader>
              <UserCartWraper cartItems={cartItems?.items || []} />
            </SheetContent>
          </Sheet>
        </div>
      )}
      
      {user ? (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={window.innerWidth >= 1024 ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer relative p-1 rounded-md hover:bg-gray-50 transition-all duration-200"
              >
                <Avatar className="h-7 w-7 border border-gray-200 shadow-sm">
                  <AvatarImage 
                    src={user?.avatar} 
                    alt={user?.userName || 'User'} 
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white text-xs font-medium">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                      : user?.userName?.substring(0, 2).toUpperCase() || 'U'
                    }
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className='min-w-[240px] p-3 bg-white text-black rounded-xl shadow-lg border border-gray-100'>
              <DropdownMenuLabel className='font-normal'>
                <div className='flex flex-col space-y-1'>
                  <p className='font-medium text-gray-900'>
                    {user?.firstName || user?.lastName 
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : user?.userName || 'User'
                    }
                  </p>
                  <p className='text-xs text-gray-500 truncate'>{user?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem 
                onClick={() => navigate('/shop/account/profile')} 
                className='cursor-pointer rounded-lg py-2 my-1 transition-colors duration-200 hover:bg-gray-50'
              >
                <UserRound className='mr-3 h-4 w-4 text-gray-600' />
                <span className="font-medium">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/shop/account/orders')} 
                className='cursor-pointer rounded-lg py-2 my-1 transition-colors duration-200 hover:bg-gray-50'
              >
                <ShoppingCart className='mr-3 h-4 w-4 text-gray-600' />
                <span className="font-medium">Orders</span>
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem 
                  onClick={() => navigate('/admin/dashboard')} 
                  className='cursor-pointer rounded-lg py-2 my-1 transition-colors duration-200 hover:bg-gray-50'
                >
                  <HousePlus className='mr-3 h-4 w-4 text-gray-600' />
                  <span className="font-medium">Admin Dashboard</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className='cursor-pointer rounded-lg py-2 my-1 transition-colors duration-200 text-red-600 hover:bg-red-50 hover:text-red-700'
              >
                <LogOut className='mr-3 h-4 w-4' />
                <span className="font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {/* Desktop: Show both Login and Register buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link to="/auth/login">
              <motion.button
                className="bg-black text-white text-sm font-medium py-2 px-3 rounded-md shadow-sm hover:bg-gray-800 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Login
              </motion.button>
            </Link>
            <Link to="/auth/register">
              <motion.button
                className="bg-white border border-gray-300 text-gray-800 text-sm font-medium py-2 px-3 rounded-md shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Register
              </motion.button>
            </Link>
          </div>
          
          {/* Mobile: Show Nike-style avatar that goes to login */}
          <div className="lg:hidden">
            <Link to="/auth/login">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer relative p-1.5 rounded-full hover:bg-gray-50 transition-all duration-200"
              >
                <div className="h-7 w-7 rounded-full bg-gray-900 hover:bg-black transition-colors duration-200 flex items-center justify-center shadow-sm">
                  <UserRound className="h-4 w-4 text-white" />
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function ShoppingHeader() {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <motion.header 
      className='sticky top-0 z-50 w-full bg-white text-gray-900 backdrop-blur-sm bg-white/90 border-b border-gray-100 shadow-md'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
    >
      <div className="max-w-screen-2xl mx-auto px-4">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to='/shop/home' className='flex items-center no-underline group'>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-700 group-hover:from-black group-hover:to-gray-500 transition-all duration-300">
                IN-N-OUT
              </span>
            </Link>
          </div>
          
          {/* Navigation - Centered */}
          <div className="flex-1 flex justify-center">
            <div className="flex space-x-1">
              <MenuItems onNavigate={() => {}} />
            </div>
          </div>
          
          {/* Right Side Elements */}
          <div className="flex items-center space-x-2">
            <Link to="/shop/search">
              <motion.button 
                className="flex items-center text-gray-700 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="mr-2 text-sm font-medium">Search</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </motion.button>
            </Link>
            <HeaderRightContent isAuthenticated={isAuthenticated} />
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="flex lg:hidden items-center justify-between h-14 px-2">
          {/* Left: Hamburger Menu */}
          <motion.button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-50 transition-all duration-200 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className='h-5 w-5 text-gray-900' />
            <span className='sr-only'>Toggle Menu</span>
          </motion.button>
          
          {/* Center: Logo */}
          <div className="flex-1 flex justify-center mx-4">
            <Link to='/shop/home' className='flex items-center no-underline'>
              <span className="font-bold text-lg text-gray-900 whitespace-nowrap">
                IN-N-OUT
              </span>
            </Link>
          </div>
          
          {/* Right: Search + User actions */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* Search Button for Mobile */}
            <Link to="/shop/search">
              <motion.button 
                className="p-2 rounded-md hover:bg-gray-50 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Search Products"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
                <span className='sr-only'>Search</span>
              </motion.button>
            </Link>
            <HeaderRightContent isAuthenticated={isAuthenticated} />
          </div>
        </div>

        {/* Mobile Navigation Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-80 p-0 bg-white">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <Link to='/shop/home' onClick={() => setMobileMenuOpen(false)}>
                  <span className="font-bold text-xl text-gray-900">IN-N-OUT</span>
                </Link>
              </div>
              
              {/* User Section - Only show if logged in */}
              {user && (
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                          : user?.userName?.substring(0, 2).toUpperCase() || 'U'
                        }
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user?.firstName || user?.lastName 
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : user?.userName || 'User'
                        }
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation - Accordion Style */}
              <div className="flex-1 overflow-auto">
                <MobileMenuAccordion 
                  menuItems={shoppingViewHeaderMenuItems} 
                  onNavigate={() => setMobileMenuOpen(false)}
                  navigate={navigate}
                />
              </div>

              {/* Bottom Section */}
              <div className="p-6 border-t border-gray-200">
                {user ? (
                  <button
                    onClick={() => {
                      dispatch(logoutUser());
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-black text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full bg-black text-white py-3 px-4 rounded-md text-sm font-medium text-center hover:bg-gray-800 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full border border-gray-300 text-gray-900 py-3 px-4 rounded-md text-sm font-medium text-center hover:bg-gray-50 transition-colors"
                    >
                      Join Us
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  )
}

export default ShoppingHeader;