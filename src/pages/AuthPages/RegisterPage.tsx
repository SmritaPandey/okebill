import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Building, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, oauthLogin } = useAuth();

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const MS_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || '';
  const MS_REDIRECT_URI = `${window.location.origin}/auth/callback`;

  const handleGoogleSignUp = () => {
    if (!GOOGLE_CLIENT_ID) { toast({ title: 'Configuration Required', description: 'Google Client ID not configured', variant: 'destructive' }); return; }
    const google = (window as any).google;
    if (!google?.accounts?.id) { toast({ title: 'Error', description: 'Google Sign-In not loaded. Please refresh.', variant: 'destructive' }); return; }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        setIsLoading(true);
        const { error } = await oauthLogin('google', { idToken: response.credential });
        setIsLoading(false);
        if (error) toast({ title: 'Sign Up Failed', description: error.message, variant: 'destructive' });
      },
    });
    google.accounts.id.prompt();
  };

  const handleMicrosoftSignUp = () => {
    if (!MS_CLIENT_ID) { toast({ title: 'Configuration Required', description: 'Microsoft Client ID not configured', variant: 'destructive' }); return; }
    const scope = encodeURIComponent('openid profile email User.Read');
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MS_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(MS_REDIRECT_URI)}&scope=${scope}&response_mode=fragment`;
    const popup = window.open(authUrl, 'Microsoft Login', 'width=500,height=700,left=200,top=100');
    if (!popup) { toast({ title: 'Error', description: 'Popup blocked. Please allow popups.', variant: 'destructive' }); return; }
    const pollTimer = setInterval(async () => {
      try {
        if (popup.closed) { clearInterval(pollTimer); return; }
        const popupUrl = popup.location.href;
        if (popupUrl.includes('access_token=')) {
          clearInterval(pollTimer);
          const hash = popupUrl.split('#')[1];
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          popup.close();
          if (accessToken) {
            setIsLoading(true);
            const { error } = await oauthLogin('microsoft', { accessToken });
            setIsLoading(false);
            if (error) toast({ title: 'Sign Up Failed', description: error.message, variant: 'destructive' });
          }
        }
      } catch { /* cross-origin, not ready yet */ }
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName || !lastName || !email || !companyName || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Store company name in localStorage for onboarding
    localStorage.setItem('pendingCompanyName', companyName);

    const { error } = await signUp(email, password, { first_name: firstName, last_name: lastName, company_name: companyName });

    setIsLoading(false);

    if (error) {
      // Handle specific error cases
      if (error.message.includes('already registered')) {
        toast({
          title: "Account exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
      return;
    }

    toast({
      title: "Account created successfully!",
      description: "Welcome to OkeBill. Let's get you set up."
    });

    // Navigation to onboarding is handled by AuthCheck
  };

  const handleSocialSignup = (provider: string) => {
    toast({
      title: "Coming Soon",
      description: `${provider} signup will be available soon.`
    });
  };

  const handleTermsClick = () => {
    toast({
      title: "Terms of Service",
      description: "Terms of Service page will be available soon."
    });
  };

  const handlePrivacyClick = () => {
    toast({
      title: "Privacy Policy",
      description: "Privacy Policy page will be available soon."
    });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <a href="/" className="flex flex-col items-center">
          <img src="/logo.png" alt="OkeBill" className="h-16 w-16 mb-4" />
          <h1 className="text-3xl font-bold text-gradient">Ok<span className="text-emerald-500">e</span>Bill</h1>
        </a>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="first-name">First name</Label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="first-name"
                    name="first-name"
                    type="text"
                    required
                    className="pl-10"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="last-name">Last name</Label>
                <div className="mt-1">
                  <Input
                    id="last-name"
                    name="last-name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="company-name">Company name</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="company-name"
                  name="company-name"
                  type="text"
                  required
                  className="pl-10"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={handleTermsClick}
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={handlePrivacyClick}
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or sign up with</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={handleGoogleSignUp} className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50">
                Google
              </button>
              <button type="button" onClick={handleMicrosoftSignUp} className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50">
                Microsoft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
