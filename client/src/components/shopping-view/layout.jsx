import React from 'react'
import { Outlet } from 'react-router-dom';
import ShoppingHeader from './header';
import Footer from './footer';
import Topbar from './topbar';

function ShoppingLayout() {
  return (
    <div className='flex flex-col bg-white overflow-hidden'>
        {/* Common Header */}
        <Topbar />
        <ShoppingHeader />
        <main className='flex flex-col w-full pt-[104px]'> {/* Add top padding to account for fixed header */}
            <Outlet/>
        </main>
        <Footer />
    </div>
  )
}

export default ShoppingLayout;