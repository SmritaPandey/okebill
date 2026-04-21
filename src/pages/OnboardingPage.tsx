import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Upload, Loader2,
  Shield, ShieldCheck, ShieldX,
  Phone, Smartphone, Building2, Palette, Crown,
  Zap, Rocket, CreditCard, Landmark, Clock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  { id: 'company', title: 'Company Details', description: 'Set up your company profile information' },
  { id: 'contact', title: 'Contact & OTP', description: 'Verify your phone number' },
  { id: 'bank', title: 'Bank Details', description: 'Add banking information for invoices' },
  { id: 'branding', title: 'Branding', description: 'Customize your platform appearance' },
  { id: 'plan', title: 'Choose Plan', description: 'Select your subscription plan' },
];

const stepIcons = [Building2, Smartphone, Landmark, Palette, Crown];

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  limits: { invoicesPerMonth: number; clients: number };
}

const planColors: Record<string, string> = {
  free_trial: 'from-gray-500 to-gray-600',
  starter: 'from-blue-500 to-blue-600',
  professional: 'from-[#1E3A5F] to-[#2C4F7C]',
  enterprise: 'from-amber-500 to-amber-600',
};

const planIcons: Record<string, React.ElementType> = {
  free_trial: Clock,
  starter: Zap,
  professional: Rocket,
  enterprise: Building2,
};

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Company
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstStatus, setGstStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [gstMessage, setGstMessage] = useState('');

  // Step 2: Contact & OTP
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Step 3: Bank
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  // Step 4: Branding
  const [primaryColor, setPrimaryColor] = useState('#1E3A5F');
  const [secondaryColor, setSecondaryColor] = useState('#6ba5e2');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Step 5: Plan
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('free_trial');

  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { createOrUpdateCompany, uploadLogo } = useCompany();

  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Load plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_URL}/subscription/plans`, { headers });
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        }
      } catch (err) { console.error('Failed to fetch plans:', err); }
    };
    fetchPlans();
  }, []);

  // Load pending company name from registration
  useEffect(() => {
    const pendingName = localStorage.getItem('pendingCompanyName');
    if (pendingName) {
      setCompanyName(pendingName);
      localStorage.removeItem('pendingCompanyName');
    }
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // ─── GSTIN Verification ──────────────────────────
  const verifyCompanyGstin = async () => {
    const g = gstin.trim().toUpperCase();
    if (!g || g.length !== 15) {
      toast.error('Please enter a valid 15-character GSTIN');
      return;
    }
    setGstVerifying(true);
    setGstStatus('idle');
    try {
      const resp = await fetch(`${API_URL}/gst/verify/${g}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      if (!resp.ok || !data.valid) {
        setGstStatus('invalid');
        setGstMessage(data.message || 'Invalid GSTIN');
        toast.error(data.message || 'Invalid GSTIN');
        return;
      }
      setGstStatus('valid');
      setGstMessage(data.legalName ? `✓ ${data.legalName}` : '✓ Valid GSTIN');
      if (data.legalName && !companyName) setCompanyName(data.tradeName || data.legalName);
      if (data.address && !address) setAddress(data.address);
      // Auto-fill PAN from GSTIN (characters 2-12 of GSTIN = PAN)
      if (!panNumber && g.length >= 12) {
        setPanNumber(g.substring(2, 12));
      }
      toast.success('GSTIN verified! Company details auto-filled.');
    } catch {
      setGstStatus('invalid');
      setGstMessage('Network error');
      toast.error('Failed to verify GSTIN');
    } finally {
      setGstVerifying(false);
    }
  };

  // ─── OTP Send ──────────────────────────────────
  const sendOtp = async () => {
    const cleaned = phone.replace(/[\s\-+]/g, '').replace(/^91/, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      toast.error('Enter a valid 10-digit Indian mobile number starting with 6-9');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone: cleaned, type: 'phone' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setOtpTimer(300); // 5 min countdown
        toast.success(data.message || 'OTP sent!');
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── OTP Verify ─────────────────────────────────
  const verifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setOtpLoading(true);
    try {
      const cleaned = phone.replace(/[\s\-+]/g, '').replace(/^91/, '');
      const res = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone: cleaned, otp: otpCode, type: 'phone' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpVerified(true);
        toast.success('Phone number verified! ✓');
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error verifying OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Logo Upload ─────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setLogo(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  // ─── Navigation ──────────────────────────────
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ─── Complete Onboarding ─────────────────────
  const completeOnboarding = async () => {
    if (!user) { toast.error('Please log in to complete onboarding'); return; }
    setIsLoading(true);
    try {
      let logoUrl: string | undefined;
      if (logoFile) { logoUrl = (await uploadLogo(logoFile)) || undefined; }

      await createOrUpdateCompany.mutateAsync({
        name: companyName || 'My Company',
        industry, website, address, logoUrl, primaryColor, secondaryColor,
        gstin: gstin || undefined,
      });

      // Save bank details and PAN to user profile
      if (bankAccountNo || bankIfsc || panNumber) {
        await fetch(`${API_URL}/settings/profile`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            panNumber: panNumber || undefined,
            gstin: gstin || undefined,
            bankAccountNo: bankAccountNo || undefined,
            bankIfsc: bankIfsc || undefined,
            bankName: bankName || undefined,
            bankBranch: bankBranch || undefined,
          }),
        });
      }

      // Handle plan selection if paid plan was chosen
      if (selectedPlan !== 'free_trial') {
        try {
          const res = await fetch(`${API_URL}/subscription/checkout`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ planId: selectedPlan }),
          });
          const checkoutData = await res.json();
          if (checkoutData.success && checkoutData.paymentProcessUrl) {
            // Mark onboarding complete, then redirect to payment
            await fetch(`${API_URL}/settings/onboarding-complete`, { method: 'POST', headers });
            await refreshProfile();
            toast.success('Setup complete! Redirecting to payment...');
            window.location.href = checkoutData.paymentProcessUrl;
            return;
          }
        } catch (err) {
          console.error('Checkout error:', err);
          // Continue without payment failure
        }
      }

      // Mark onboarding as complete
      await fetch(`${API_URL}/settings/onboarding-complete`, { method: 'POST', headers });
      await refreshProfile();
      toast.success('Setup complete! Welcome to OkBill.');
      // Full page reload to ensure AuthCheck reads fresh onboardingComplete state
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(`Failed to complete setup: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="OkBill" className="h-9 w-9" />
            <span className="text-xl font-semibold text-brand-navy">OkBill</span>
          </a>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <a href="#" className="text-brand-navy">Need help?</a>
            <a href="/dashboard" className="font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Skip for now →
            </a>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to OkBill</h1>
          <p className="mt-2 text-lg text-gray-600">Let's get your account set up so you can start billing.</p>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Step indicators */}
          <div className="flex border-b border-gray-200">
            {steps.map((step, index) => {
              const StepIcon = stepIcons[index];
              return (
                <button
                  key={step.id}
                  className={`flex-1 py-4 px-2 text-center ${index === currentStep
                    ? 'border-b-2 border-brand-navy text-brand-navy'
                    : index < currentStep ? 'text-green-600' : 'text-gray-400'
                    }`}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                >
                  <div className="flex items-center justify-center mb-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${index < currentStep ? 'bg-green-100 text-green-700'
                      : index === currentStep ? 'bg-brand-navy text-white'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                      {index < currentStep ? <Check className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div className="text-xs font-medium">{step.title}</div>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* ─── Step 1: Company Details ───────────────── */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Company Information</h2>
                  <p className="text-sm text-gray-500">Provide details about your company to personalize your experience.</p>
                </div>

                <div className="space-y-4">
                  {/* GSTIN */}
                  <div>
                    <Label htmlFor="gstin">GSTIN (auto-fill company details)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="gstin" value={gstin}
                        onChange={(e) => { setGstin(e.target.value.toUpperCase()); setGstStatus('idle'); }}
                        placeholder="22AAAAA0000A1Z5" maxLength={15}
                        className="font-mono uppercase tracking-wider"
                      />
                      <Button type="button" variant="outline" size="sm"
                        onClick={verifyCompanyGstin}
                        disabled={gstVerifying || gstin.length < 15}
                        className="whitespace-nowrap"
                      >
                        {gstVerifying ? (<><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Verifying...</>) : (<><Shield className="w-4 h-4 mr-1" /> Verify</>)}
                      </Button>
                    </div>
                    {gstStatus === 'valid' && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> {gstMessage}</p>}
                    {gstStatus === 'invalid' && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><ShieldX className="w-3.5 h-3.5" /> {gstMessage}</p>}
                  </div>

                  {/* PAN */}
                  <div>
                    <Label htmlFor="pan">PAN Number</Label>
                    <Input id="pan" value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F" maxLength={10}
                      className="mt-1 font-mono uppercase tracking-wider"
                    />
                    {panNumber && panNumber.length === 10 && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber) && (
                      <p className="text-xs text-red-500 mt-1">Invalid PAN format</p>
                    )}
                  </div>

                  {/* Company Name */}
                  <div>
                    <Label htmlFor="company-name">Company name *</Label>
                    <Input id="company-name" value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)} className="mt-1" required />
                  </div>

                  {/* Industry */}
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <select id="industry" value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select an industry</option>
                      <option value="energy">Energy</option>
                      <option value="telecommunications">Telecommunications</option>
                      <option value="software">Software & Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="financial">Financial Services</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="retail">Retail</option>
                      <option value="consulting">Consulting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Website */}
                  <div>
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input id="website" type="url" value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="mt-1" placeholder="https://www.example.com" />
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address">Business address</Label>
                    <textarea id="address" value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border border-input bg-background rounded-md shadow-sm focus:ring-2 focus:ring-ring px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 2: Contact & OTP ─────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Contact & Verification</h2>
                  <p className="text-sm text-gray-500">Verify your mobile number with OTP for secure communication.</p>
                </div>

                <div className="space-y-4 max-w-md">
                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phone">Mobile Number</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex items-center px-3 bg-gray-100 border border-input rounded-md text-sm text-gray-600 font-medium">
                        +91
                      </div>
                      <Input id="phone" value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpVerified(false); setOtpSent(false); }}
                        placeholder="9876543210" maxLength={10}
                        className="font-mono tracking-wider" disabled={otpVerified}
                      />
                    </div>
                  </div>

                  {!otpVerified && (
                    <>
                      {/* Send OTP Button */}
                      {!otpSent ? (
                        <Button onClick={sendOtp} disabled={otpLoading || phone.length !== 10}
                          className="w-full"
                        >
                          {otpLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Phone className="h-4 w-4 mr-2" />}
                          Send OTP
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          {/* OTP Input */}
                          <div>
                            <Label htmlFor="otp">Enter OTP</Label>
                            <Input id="otp" value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000" maxLength={6}
                              className="mt-1 font-mono text-center text-xl tracking-[0.5em]"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={verifyOtp} disabled={otpLoading || otpCode.length !== 6}
                              className="flex-1"
                            >
                              {otpLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                              Verify OTP
                            </Button>
                            <Button variant="outline" onClick={sendOtp}
                              disabled={otpLoading || otpTimer > 0}
                              className="whitespace-nowrap"
                            >
                              {otpTimer > 0 ? `Resend (${Math.floor(otpTimer / 60)}:${String(otpTimer % 60).padStart(2, '0')})` : 'Resend OTP'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Verified badge */}
                  {otpVerified && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Phone number verified successfully!</span>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> In development mode, the OTP will be logged in the server console. Check the terminal running your backend server.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 3: Bank Details ──────────────────── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Bank Details</h2>
                  <p className="text-sm text-gray-500">Add banking information to display on invoices for client payments. You can skip this step and add later.</p>
                </div>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <Label htmlFor="bankAccountNo">Account Number</Label>
                    <Input id="bankAccountNo" value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1234567890123456" className="mt-1 font-mono" />
                  </div>
                  <div>
                    <Label htmlFor="bankIfsc">IFSC Code</Label>
                    <Input id="bankIfsc" value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234" maxLength={11} className="mt-1 font-mono uppercase" />
                    {bankIfsc && bankIfsc.length === 11 && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc) && (
                      <p className="text-xs text-red-500 mt-1">Invalid IFSC format</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="bankBranch">Branch</Label>
                    <Input id="bankBranch" value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="e.g. Main Branch, Mumbai" className="mt-1" />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700">
                      <Landmark className="w-3.5 h-3.5 inline mr-1" />
                      <strong>Optional:</strong> Bank details will appear on your invoices so clients know where to make payment. You can add or update these later in Settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 4: Branding ─────────────────────── */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Brand Customization</h2>
                  <p className="text-sm text-gray-500">Customize the appearance of your OkBill platform to match your brand.</p>
                </div>

                <div className="space-y-4">
                  {/* Logo Upload */}
                  <div>
                    <Label htmlFor="logo-upload">Company Logo</Label>
                    <div className="mt-1 flex items-center">
                      {logo ? (
                        <div className="relative">
                          <img src={logo} alt="Logo Preview" className="w-32 h-32 object-contain border rounded" />
                          <button type="button" className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-sm"
                            onClick={() => { setLogo(null); setLogoFile(null); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="logo-upload" className="relative cursor-pointer rounded-md font-medium text-brand-navy hover:text-brand-navy-dark">
                                <span>Upload a file</span>
                                <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleLogoUpload} accept="image/*" />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <div className="relative flex items-stretch flex-grow">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">#</span>
                          </div>
                          <Input type="text" id="primary-color" className="pl-7"
                            value={primaryColor.replace('#', '')}
                            onChange={(e) => setPrimaryColor('#' + e.target.value.replace(/[^0-9a-fA-F]/g, ''))}
                            maxLength={6} />
                        </div>
                        <input type="color" value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="-ml-px relative inline-flex items-center w-12 rounded-r-md border border-input" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <div className="relative flex items-stretch flex-grow">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">#</span>
                          </div>
                          <Input type="text" id="secondary-color" className="pl-7"
                            value={secondaryColor.replace('#', '')}
                            onChange={(e) => setSecondaryColor('#' + e.target.value.replace(/[^0-9a-fA-F]/g, ''))}
                            maxLength={6} />
                        </div>
                        <input type="color" value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="-ml-px relative inline-flex items-center w-12 rounded-r-md border border-input" />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <Label>Preview</Label>
                    <div className="mt-2 p-4 border rounded-md">
                      <div className="flex items-center gap-4 mb-4">
                        {logo && <img src={logo} alt="Logo" className="h-10 w-auto" />}
                        <h3 className="font-bold" style={{ color: primaryColor }}>
                          {companyName || "Your Company"}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="px-4 py-2 rounded-md text-white" style={{ backgroundColor: primaryColor }}>Primary</button>
                        <button type="button" className="px-4 py-2 rounded-md text-white" style={{ backgroundColor: secondaryColor }}>Secondary</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 5: Plan Selection ────────────────── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Choose Your Plan</h2>
                  <p className="text-sm text-gray-500">
                    You're currently on a <strong>14-day free trial</strong>. Select a plan to upgrade, or continue with the free trial.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const Icon = planIcons[plan.id] || Zap;
                    return (
                      <Card key={plan.id}
                        className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
                          } ${plan.id === 'professional' ? 'border-emerald-200' : ''}`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {plan.id === 'professional' && (
                          <div className="absolute top-0 right-0 bg-gradient-to-r from-[#1E3A5F] to-[#2C4F7C] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                            POPULAR
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 left-2">
                            <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}
                        <CardHeader className="pb-2 pt-4">
                          <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${planColors[plan.id]} flex items-center justify-center mb-1`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          <CardDescription>
                            {plan.price === 0 ? (
                              <span className="text-xl font-bold text-gray-900">Free</span>
                            ) : (
                              <span><span className="text-xl font-bold text-gray-900">₹{plan.price}</span><span className="text-gray-500">/mo</span></span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <ul className="space-y-1.5">
                            {plan.features.slice(0, 4).map((f, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                            {plan.features.length > 4 && (
                              <li className="text-xs text-gray-400">+{plan.features.length - 4} more features</li>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {selectedPlan !== 'free_trial' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <CreditCard className="w-4 h-4 inline mr-1" />
                      You'll be redirected to our secure payment partner (PayG) to complete the payment after setup.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Processing...
                </span>
              ) : currentStep === steps.length - 1 ? (
                <span className="flex items-center">
                  {selectedPlan !== 'free_trial' ? 'Complete & Pay' : 'Complete Setup'} <Check className="ml-2 h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center">
                  {currentStep === 1 && !otpVerified ? 'Skip & Continue' : 'Next'} <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
