import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, ArrowRight, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, oauthLogin } = useAuth();

  // Show message if redirected due to session expiry
  useEffect(() => {
    if (searchParams.get('session') === 'expired') {
      toast({ title: 'Session Expired', description: 'Your session has expired. Please log in again.', variant: 'destructive' });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({ title: "Login failed", description: error.message || "Invalid email or password", variant: "destructive" });
      return;
    }

    toast({ title: "Welcome back!", description: "You have successfully logged in." });
  };

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const MS_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || '';
  const MS_REDIRECT_URI = `${window.location.origin}/auth/callback`;

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast({ title: 'Configuration Required', description: 'Google Client ID not configured', variant: 'destructive' });
      return;
    }
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      toast({ title: 'Error', description: 'Google Sign-In not loaded. Please refresh.', variant: 'destructive' });
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        setIsLoading(true);
        const { error } = await oauthLogin('google', { idToken: response.credential });
        setIsLoading(false);
        if (error) toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      },
    });
    google.accounts.id.prompt();
  };

  const handleMicrosoftLogin = () => {
    if (!MS_CLIENT_ID) {
      toast({ title: 'Configuration Required', description: 'Microsoft Client ID not configured', variant: 'destructive' });
      return;
    }
    const scope = encodeURIComponent('openid profile email User.Read');
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MS_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(MS_REDIRECT_URI)}&scope=${scope}&response_mode=fragment`;
    const popup = window.open(authUrl, 'Microsoft Login', 'width=500,height=700,left=200,top=100');
    if (!popup) {
      toast({ title: 'Error', description: 'Popup blocked. Please allow popups and try again.', variant: 'destructive' });
      return;
    }
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
            if (error) toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
          }
        }
      } catch { /* cross-origin */ }
    }, 500);
  };

  const handleForgotPassword = () => {
    toast({ title: "Password Reset", description: "Password reset functionality will be available soon." });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#2C4F7C] to-[#152C48]">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-teal-300/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-white/15 rounded-2xl backdrop-blur-sm">
              <img src="/logo.png" alt="OkBill" className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">OkBill</h1>
              <p className="text-emerald-200 text-sm">Simple | Hisab | Accurate</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Simple. <br />
            <span className="text-emerald-200">Hisab.</span> <br />
            Accurate.
          </h2>

          <p className="text-emerald-100/80 text-lg leading-relaxed max-w-md">
            E-Invoice, E-Way Bill, GSTR-1 — all automated. Join thousands of Indian businesses managing their billing with OkBill.
          </p>

          <div className="mt-10 flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">GST</div>
              <div className="text-emerald-200 text-xs">Compliant</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">IRP</div>
              <div className="text-emerald-200 text-xs">E-Invoice</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">NIC</div>
              <div className="text-emerald-200 text-xs">E-Way Bill</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex flex-1 flex-col justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile logo */}
          <div className="flex flex-col items-center lg:hidden mb-8">
            <div className="p-3 bg-emerald-50 rounded-2xl mb-3">
              <Receipt size={28} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">OkBill</h1>
          </div>

          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
              Register here
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm ring-1 ring-gray-900/5 rounded-2xl sm:px-10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@company.com"
                    className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 uppercase tracking-wider">Or continue with</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="inline-flex w-full justify-center items-center rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  className="inline-flex w-full justify-center items-center rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                  Microsoft
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-emerald-500 hover:text-emerald-600">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-emerald-500 hover:text-emerald-600">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
