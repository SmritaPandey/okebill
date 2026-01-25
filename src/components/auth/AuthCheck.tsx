import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthCheckProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
}

/**
 * AuthCheck component to handle authentication and onboarding routing
 * 
 * @param children - The child components to render if auth check passes
 * @param requireAuth - If true, redirect to login if not authenticated
 * @param requireOnboarding - If true, redirect to onboarding if not completed
 */
const AuthCheck: React.FC<AuthCheckProps> = ({ 
  children, 
  requireAuth = true,
  requireOnboarding = true 
}) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;
  const onboardingComplete = profile?.onboarding_complete ?? false;

  // If auth is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If auth and onboarding are required, and onboarding isn't complete, redirect to onboarding
  if (requireAuth && requireOnboarding && isAuthenticated && !onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is authenticated and tries to access public auth pages (login/register/landing), redirect appropriately
  if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register')) {
    if (!onboardingComplete) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthCheck;
