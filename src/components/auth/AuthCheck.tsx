
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    // In a real app, you would check with an auth service
    // For now we'll use localStorage as a mock
    const authState = localStorage.getItem('isAuthenticated') === 'true';
    const onboardingState = localStorage.getItem('onboardingComplete') === 'true';
    
    setIsAuthenticated(authState);
    setOnboardingComplete(onboardingState);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    // You could add a loading spinner here
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If auth is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If auth and onboarding are required, and onboarding isn't complete, redirect to onboarding
  if (requireAuth && requireOnboarding && isAuthenticated && !onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is authenticated and tries to access auth pages (login/register), redirect to app
  if (isAuthenticated && window.location.pathname.match(/^\/(login|register)$/)) {
    if (!onboardingComplete) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthCheck;
