import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

function CheckAuth({ isAuthenticated, user, children }) {
    const location = useLocation();
    const path = location.pathname;

    // Better debugging
    useEffect(() => {
        console.log('CheckAuth rendered with:', { 
            path, 
            isAuthenticated, 
            userRole: user?.role,
            isSuperAdmin: user?.role === 'superAdmin'
        });
    }, [path, isAuthenticated, user]);
    



    if(path === '/') {
        if(!isAuthenticated){
            return <Navigate to="/auth/login" replace />;
        } else {
            if (user?.role === 'superAdmin') {
                return <Navigate to="/super-admin/dashboard" replace />;
            } else if (user?.role === 'admin') {
                return <Navigate to="/admin/dashboard" replace />;
            } else {
                return <Navigate to="/shop/home" replace />;
            }
        }
    }

    // Early return if no auth check needed
    if (!isAuthenticated && (path === '/auth/login' || path === '/auth/register')) {
        return <>{children}</>;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    // Authenticated but on auth pages - redirect based on role
    if (path === '/auth/login' || path === '/auth/register') {
        if (user?.role === 'superAdmin') {
            return <Navigate to="/super-admin/dashboard" replace />;
        } else if (user?.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else {
            return <Navigate to="/shop/home" replace />;
        }
    }

    // Non-admin trying to access admin routes
    if (user?.role !== 'admin' && user?.role !== 'superAdmin' && path.startsWith('/admin')) {
        return <Navigate to="/unauth-page" replace />;
    }

    // Non-superAdmin trying to access superAdmin routes
    if (user?.role !== 'superAdmin' && path.startsWith('/super-admin')) {
        return <Navigate to="/unauth-page" replace />;
    }

    // Admin trying to access shop routes
    if ((user?.role === 'admin' || user?.role === 'superAdmin') && path.startsWith('/shop')) {
        return <Navigate to={user?.role === 'superAdmin' ? '/super-admin/dashboard' : '/admin/dashboard'} replace />;
    }

    // All checks passed - render children
    return <>{children}</>;
}

export default CheckAuth;