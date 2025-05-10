import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { HousePlus, Menu, ShoppingBag, UserRound, LogOut, Heart } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useDispatch, useSelector } from 'react-redux';
import { shoppingViewHeaderMenuItems } from '@/config';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { logoutUser } from '@/store/auth-slice';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import UserCartItemsContent from './cartItemsContent';
import UserCartWraper from './cartWrapper';
import { fetchCartItems } from '@/store/shop/cart-slice';
import { fetchWishlistItems } from '@/store/shop/wishlist-slice';
import { Label } from '../ui/label';

function MenuItems() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHomePage = location.pathname === '/shop/home' || location.pathname === '/shop';

  function handleNaviagte(getCerrentMenuItem){
    sessionStorage.removeItem('filters');
    const currentFilter =
    getCerrentMenuItem.id !==  'home'  && getCerrentMenuItem.id !== 'products' && getCerrentMenuItem.id !== 'search' ?
    {
      category : [getCerrentMenuItem.id]
    } : null


    sessionStorage.setItem('filters', JSON.stringify(currentFilter));


    location.pathname.includes('listing') && currentFilter !== null ? 
    setSearchParams(new URLSearchParams(`?category=${getCerrentMenuItem.id}`)) : 
    navigate(getCerrentMenuItem.path)

  }

  return (
    <nav className='flex flex-col mb-3 lg:mb-0 lg:items-center gap-6 lg:flex-row'>
      {shoppingViewHeaderMenuItems
        .filter(menuItem => !(isHomePage && menuItem.id === 'home'))
        .map((menuItem, index) => (
          <motion.div
            key={menuItem.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Label 
              onClick={() => handleNaviagte(menuItem)}
              className={cn(
                'text-sm font-medium relative group',
                'text-gray-800 hover:text-black transition-colors duration-300',
                'px-3 py-2 rounded-lg hover:bg-gray-100/50',
                'cursor-pointer'
              )}
            >
              <span className="relative z-10">{menuItem.label}</span>
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg opacity-0 group-hover:opacity-100 -z-10"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </Label>
          </motion.div>
        ))}
    </nav>
  )
}

function HeaderRightContent() {
  const { user } = useSelector(state => state.auth);
  const {cartItems}  = useSelector(state => state.shopCart);
  const { wishlistItems } = useSelector(state => state.wishlist);
  const [ openCartSheet, setOpenCartSheet ] = useState(false);
  const [ openWishlistSheet, setOpenWishlistSheet ] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function handleLogout() {
    dispatch(logoutUser());
  }

  useEffect(() => {
    if (user) {
      const userId = user.id || user._id;
      if (userId) {
        dispatch(fetchCartItems(userId));
        dispatch(fetchWishlistItems(userId));
      }
    }
  }, [dispatch, user])

  return (
    <div className="flex items-center gap-4">
      {/* Wishlist Button */}
      {user && (
        <Link to="/shop/wishlist">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full relative group bg-white border border-gray-200 shadow-sm cursor-pointer"
          >
            <Heart className={`w-6 h-6 ${wishlistItems?.length > 0 ? 'fill-red-500 text-red-500' : 'text-gray-800'}`} />
            <span className='sr-only'>Wishlist</span>
            {wishlistItems?.length > 0 && (
              <motion.span 
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full 
                h-5 w-5 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {wishlistItems.length}
              </motion.span>
            )}
          </motion.button>
        </Link>
      )}
      
      {/* Cart Button */}
      <Sheet 
      open={openCartSheet}
      onOpenChange={() => setOpenCartSheet(false)}
      >
        <motion.button 
        onClick={() => {
          if (!user) {
            // Redirect to login if user is not authenticated
            navigate('/auth/login');
            return;
          }
          setOpenCartSheet(true);
        }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full relative group bg-white border border-gray-200 shadow-sm cursor-pointer"
        >
          <ShoppingBag className='w-6 h-6 text-gray-800' />
          <span className='sr-only'>Cart</span>
          {user && (
            <motion.span 
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full 
              h-5 w-5 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              {cartItems?.items?.length || 0}
            </motion.span>
          )}
        </motion.button>
        {user && (
          <UserCartWraper 
          setOpenCartSheet={setOpenCartSheet}
          cartItems={cartItems && cartItems.items && cartItems.items.length > 0 ? cartItems.items : []} />
        )}
      </Sheet>
      
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Avatar className='cursor-pointer shadow-md border-2 border-white hover:border-indigo-200 transition-all duration-300'>
                <AvatarFallback className='bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold'>
                  {user?.userName && user.userName[0] ? user.userName[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side='right' 
            className='w-64 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden py-2 mt-1'
            align="end"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 mb-2">
              <div className="flex items-center gap-3">
                <Avatar className='h-10 w-10 border-2 border-white shadow-sm'>
                  <AvatarFallback className='bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold'>
                    {user?.userName && user.userName[0] ? user.userName[0].toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-900">{user?.userName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'User'}</p>
                </div>
              </div>
            </div>
            
            <DropdownMenuItem 
              onClick={() => navigate('/shop/account')}
              className='cursor-pointer hover:bg-indigo-50 transition-colors text-gray-700 px-4 py-2.5 mx-1 rounded-lg focus:bg-indigo-50 focus:text-indigo-700'
            >
              <div className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                <UserRound className='h-4 w-4' />
              </div>
              <span className="font-medium">Account</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-2 bg-gray-100" />
            
            <DropdownMenuItem 
              onClick={handleLogout}
              className='cursor-pointer hover:bg-red-50 transition-colors text-gray-700 px-4 py-2.5 mx-1 rounded-lg focus:bg-red-50 focus:text-red-600'
            >
              <div className="p-1.5 rounded-full bg-red-100 text-red-600 mr-3">
                <LogOut className='h-4 w-4' />
              </div>
              <span className="font-medium">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link to="/auth/login">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="py-2 px-4 bg-black text-white rounded-lg font-medium"
          >
            Login
          </motion.button>
        </Link>
      )}
    </div>
  )
}

function ShoppingHeader() {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <motion.header 
      className='sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <div className="relative flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Mobile: Menu button (left) and Centered Logo */}
        <div className="flex items-center lg:hidden">
          {/* Mobile menu button - stays left */}
          <Sheet>
            <SheetTrigger asChild>
              <motion.button 
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors mr-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu className='h-6 w-6 text-gray-800' />
                <span className='sr-only'>Toggle Menu</span>
              </motion.button>
            </SheetTrigger>
            <SheetContent side='left' className='w-full max-w-xs bg-white border-r border-gray-200'>
              <MenuItems />
            </SheetContent>
          </Sheet>

          {/* Logo - centered on mobile */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link to='/shop/home' className='flex items-center no-underline'>
              <span className="font-bold text-xl text-gray-900 whitespace-nowrap">
                IN-N-OUT
              </span>
            </Link>
          </div>
        </div>

        {/* Desktop: Logo (left-aligned) */}
        <div className="hidden lg:block">
          <Link to='/shop/home' className='flex items-center no-underline'>
            <span className="font-bold text-xl text-gray-900 whitespace-nowrap">
              IN-N-OUT
            </span>
          </Link>
        </div>

        {/* Desktop: Centered Menu Items */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-center">
          <MenuItems />
        </div>

        {/* User/Cart (right-aligned on all screens) */}
        <div className="flex items-center justify-end">
          <HeaderRightContent />
        </div>
      </div>
    </motion.header>
  )
}

export default ShoppingHeader;