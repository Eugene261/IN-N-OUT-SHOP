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
        <main className='flex flex-col w-full'>
            <Outlet/>
        </main>
        <Footer />
    </div>
  )
}

export default ShoppingLayout;