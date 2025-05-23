import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

function CheckAuth({ isAuthenticated, user, children, requiredRole }) {
    const location = useLocation();
    const path = location.pathname;

    // Better debugging
    useEffect(() => {
        console.log('CheckAuth rendered with:', { 
            path, 
            isAuthenticated, 
            userRole: user?.role,
            requiredRole,
            isSuperAdmin: user?.role === 'superAdmin'
        });
    }, [path, isAuthenticated, user, requiredRole]);
    



    if(path === '/') {
        if(!isAuthenticated){
            // Redirect unauthenticated users to shop home instead of login
            return <Navigate to="/shop/home" replace />;
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

    // Not authenticated - redirect to login except for shop pages
    if (!isAuthenticated) {
        // Allow access to shop pages without authentication
        if (path.startsWith('/shop')) {
            return <>{children}</>;
        }
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

        // Check required role if specified    if (requiredRole) {        if (requiredRole === 'admin' && user?.role !== 'admin' && user?.role !== 'superAdmin') {            return <Navigate to="/unauth-page" replace />;        }        if (requiredRole === 'superAdmin' && user?.role !== 'superAdmin') {            return <Navigate to="/unauth-page" replace />;        }    }    // Non-admin trying to access admin routes    if (user?.role !== 'admin' && user?.role !== 'superAdmin' && path.startsWith('/admin')) {        return <Navigate to="/unauth-page" replace />;    }    // Non-superAdmin trying to access superAdmin routes    if (user?.role !== 'superAdmin' && path.startsWith('/super-admin')) {        return <Navigate to="/unauth-page" replace />;    }

    // Admin trying to access shop routes
    if ((user?.role === 'admin' || user?.role === 'superAdmin') && path.startsWith('/shop')) {
        return <Navigate to={user?.role === 'superAdmin' ? '/super-admin/dashboard' : '/admin/dashboard'} replace />;
    }

    // All checks passed - render children
    return <>{children}</>;
}

export default CheckAuth;