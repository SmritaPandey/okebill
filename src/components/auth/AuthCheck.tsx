import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthCheckProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * AuthCheck component to handle authentication routing.
 * Onboarding is optional — users can skip it and complete it later in Settings.
 */
const AuthCheck: React.FC<AuthCheckProps> = ({
  children,
  requireAuth = true,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  // If auth is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated and tries to access public auth pages, redirect to dashboard
  if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthCheck;
