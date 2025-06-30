import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminHeader from './header';
import AdminSidebar from './sidebar';
import FloatingMessageButton from '../common/messaging/FloatingMessageButton';
import MessageWidget from '../common/messaging/MessageWidget';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messageWidgetOpen, setMessageWidgetOpen] = useState(false);
  const sidebarRef = useRef(null);
  
  // Check if we're on the messages page
  const isOnMessagesPage = location.pathname.includes('/messages');
  
  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleMessageWidget = () => {
    // Check screen size
    const isDesktop = window.innerWidth >= 1024; // lg breakpoint
    
    if (isDesktop) {
      // On desktop, navigate to full page messaging
      navigate('/admin/messages');
    } else {
      // On mobile, use widget
      setMessageWidgetOpen(prev => !prev);
    }
  };

  const closeMessageWidget = () => {
    setMessageWidgetOpen(false);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white border-r border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
      >
        <AdminSidebar 
          onItemClick={closeSidebar} 
          onClose={closeSidebar}
        />
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-white border-r border-gray-200">
          <AdminSidebar />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader onMenuToggle={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Message Widget - Only show when NOT on messages page */}
      {!isOnMessagesPage && (
        <FloatingMessageButton 
          isOpen={messageWidgetOpen}
          onClick={toggleMessageWidget}
        />
      )}
      {/* Only show widget on mobile and when not on messages page */}
      {!isOnMessagesPage && window.innerWidth < 1024 && (
        <MessageWidget 
          isOpen={messageWidgetOpen}
          onClose={closeMessageWidget}
        />
      )}
    </div>
  );
}

export default AdminLayout;