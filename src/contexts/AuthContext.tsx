import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, type User as ApiUser } from '@/lib/api-client';

// Normalized user type that works with both old and new pages
export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string; company_name?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  oauthLogin: (provider: 'google' | 'microsoft', tokenData: { idToken?: string; accessToken?: string }) => Promise<{ error: Error | null }>;
  // Alias for multi-utility pages using `login`/`register`/`logout`
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; companyName: string }) => Promise<void>;
  logout: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function apiUserToAppUser(apiUser: ApiUser): AppUser {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    companyName: apiUser.companyName,
    role: apiUser.role,
    user_metadata: {
      first_name: apiUser.firstName,
      last_name: apiUser.lastName,
    },
  };
}

function apiUserToProfile(apiUser: ApiUser): Profile {
  return {
    id: String(apiUser.id),
    user_id: String(apiUser.id),
    first_name: apiUser.firstName,
    last_name: apiUser.lastName,
    email: apiUser.email,
    avatar_url: null,
    onboarding_complete: apiUser.onboardingComplete ?? false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from localStorage and validate against server
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as ApiUser;
        setToken(storedToken);
        setUser(apiUserToAppUser(parsedUser));
        setProfile(apiUserToProfile(parsedUser));

        // Validate token against server (non-blocking — don't hold up render)
        authApi.me().then(response => {
          if (response.user) {
            setUser(apiUserToAppUser(response.user));
            setProfile(apiUserToProfile(response.user));
            localStorage.setItem('auth_user', JSON.stringify(response.user));
          }
        }).catch(() => {
          // Token invalid — clear auth silently
          clearAuth();
        });
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Proactive token refresh — check every 5 minutes if token is near expiry
  useEffect(() => {
    if (!token) return;

    const checkExpiry = () => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        const oneHour = 60 * 60 * 1000;
        if (expiresAt - Date.now() < oneHour) {
          // Token expires in < 1 hour → silently refresh
          authApi.refresh().then(response => {
            handleAuthSuccess(response.token, response.user);
          }).catch(() => {
            // Refresh failed — don't force logout yet, token might still work
          });
        }
      } catch {
        // Invalid token format — ignore
      }
    };

    const interval = setInterval(checkExpiry, 5 * 60 * 1000); // Check every 5 min
    return () => clearInterval(interval);
  }, [token]);

  const handleAuthSuccess = (authToken: string, apiUser: ApiUser) => {
    setToken(authToken);
    setUser(apiUserToAppUser(apiUser));
    setProfile(apiUserToProfile(apiUser));
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(apiUser));
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setProfile(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  // Old-style signIn (returns { error })
  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      handleAuthSuccess(response.token, response.user);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Old-style signUp (returns { error })
  const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string; company_name?: string }) => {
    try {
      const response = await authApi.register({
        email,
        password,
        firstName: metadata?.first_name || '',
        lastName: metadata?.last_name || '',
        companyName: metadata?.company_name || '',
      });
      handleAuthSuccess(response.token, response.user);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // New-style login (throws on error) - used by multi-utility pages
  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    handleAuthSuccess(response.token, response.user);
  };

  // New-style register (throws on error) - used by multi-utility pages
  const register = async (data: { email: string; password: string; firstName: string; lastName: string; companyName: string }) => {
    const response = await authApi.register(data);
    handleAuthSuccess(response.token, response.user);
  };

  // OAuth login (returns { error })
  const oauthLogin = async (provider: 'google' | 'microsoft', tokenData: { idToken?: string; accessToken?: string }) => {
    try {
      const response = await authApi.oauth({ provider, ...tokenData });
      handleAuthSuccess(response.token, response.user);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Logout
  const logout = () => {
    authApi.logout().catch(() => { }); // fire and forget
    clearAuth();
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors on logout
    }
    clearAuth();
  };

  const refreshProfile = async () => {
    try {
      const response = await authApi.me();
      if (response.user) {
        setUser(apiUserToAppUser(response.user));
        setProfile(apiUserToProfile(response.user));
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }
    } catch {
      // If token is invalid, clear auth
      clearAuth();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    profile,
    isLoading,
    signUp,
    signIn,
    oauthLogin,
    login,
    register,
    logout,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
