
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Upload, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'company',
    title: 'Company Details',
    description: 'Set up your company profile information',
  },
  {
    id: 'branding',
    title: 'Branding',
    description: 'Customize the look and feel of your platform',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect your existing tools and services',
  },
  {
    id: 'summary',
    title: 'Summary',
    description: 'Review your setup and finish onboarding',
  },
];

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f52ba');
  const [secondaryColor, setSecondaryColor] = useState('#6ba5e2');
  const [logo, setLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const completeOnboarding = () => {
    setIsLoading(true);
    
    // In a real app, you would send the collected data to your backend
    setTimeout(() => {
      localStorage.setItem('onboardingComplete', 'true');
      setIsLoading(false);
      navigate('/');
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-brand-blue">BillWise</h1>
          <div className="text-sm text-gray-500">
            Need help? <a href="#" className="text-brand-blue">Contact Support</a>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to BillWise</h1>
          <p className="mt-2 text-lg text-gray-600">Let's get your account set up so you can start billing.</p>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            {steps.map((step, index) => (
              <button
                key={step.id}
                className={`flex-1 py-4 px-2 text-center ${
                  index === currentStep
                    ? 'border-b-2 border-brand-blue text-brand-blue'
                    : index < currentStep
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
                onClick={() => index <= currentStep && setCurrentStep(index)}
              >
                <div className="flex items-center justify-center mb-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    index < currentStep
                      ? 'bg-green-100 text-green-700'
                      : index === currentStep
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                </div>
                <div className="text-sm font-medium">{step.title}</div>
              </button>
            ))}
          </div>

          <div className="p-6">
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Company Information</h2>
                  <p className="text-sm text-gray-500">Provide details about your company to personalize your experience.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Company name</Label>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
                      required
                    >
                      <option value="">Select an industry</option>
                      <option value="energy">Energy</option>
                      <option value="telecommunications">Telecommunications</option>
                      <option value="software">Software & Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="financial">Financial Services</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="retail">Retail</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="mt-1"
                      placeholder="https://www.example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Business address</Label>
                    <textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Brand Customization</h2>
                  <p className="text-sm text-gray-500">Customize the appearance of your BillWise platform to match your brand.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logo-upload">Company Logo</Label>
                    <div className="mt-1 flex items-center">
                      {logo ? (
                        <div className="relative">
                          <img src={logo} alt="Logo Preview" className="w-32 h-32 object-contain border rounded" />
                          <button
                            type="button"
                            className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-sm"
                            onClick={() => setLogo(null)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-blue hover:text-brand-blue-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-blue">
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

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <div className="relative flex items-stretch flex-grow focus-within:z-10">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">#</span>
                          </div>
                          <Input
                            type="text"
                            name="primary-color"
                            id="primary-color"
                            className="pl-7"
                            value={primaryColor.replace('#', '')}
                            onChange={(e) => setPrimaryColor('#' + e.target.value.replace(/[^0-9a-fA-F]/g, ''))}
                            maxLength={6}
                          />
                        </div>
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="-ml-px relative inline-flex items-center w-12 rounded-r-md border border-gray-300"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <div className="relative flex items-stretch flex-grow focus-within:z-10">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">#</span>
                          </div>
                          <Input
                            type="text"
                            name="secondary-color"
                            id="secondary-color"
                            className="pl-7"
                            value={secondaryColor.replace('#', '')}
                            onChange={(e) => setSecondaryColor('#' + e.target.value.replace(/[^0-9a-fA-F]/g, ''))}
                            maxLength={6}
                          />
                        </div>
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="-ml-px relative inline-flex items-center w-12 rounded-r-md border border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

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
                        <button
                          type="button"
                          className="px-4 py-2 rounded-md text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Primary Button
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-md text-white"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          Secondary Button
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Integrations</h2>
                  <p className="text-sm text-gray-500">Connect BillWise with your existing systems and tools.</p>
                </div>

                <div className="space-y-6">
                  <Tabs defaultValue="accounting" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="accounting">Accounting</TabsTrigger>
                      <TabsTrigger value="crm">CRM</TabsTrigger>
                      <TabsTrigger value="payment">Payment Gateways</TabsTrigger>
                    </TabsList>
                    <TabsContent value="accounting" className="p-4 border rounded-md mt-2">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium">QuickBooks</h3>
                              <p className="text-sm text-gray-500">Connect your QuickBooks account to sync invoices and payments</p>
                            </div>
                          </div>
                          <Button variant="outline">Connect</Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 3V19H21V3H5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M19 21H3V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M10 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M10 16H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium">Xero</h3>
                              <p className="text-sm text-gray-500">Connect your Xero account to sync financial data</p>
                            </div>
                          </div>
                          <Button variant="outline">Connect</Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="crm" className="p-4 border rounded-md mt-2">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18 18C18 15.7909 15.3137 14 12 14C8.68629 14 6 15.7909 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium">Salesforce</h3>
                              <p className="text-sm text-gray-500">Connect to Salesforce to import your clients and contacts</p>
                            </div>
                          </div>
                          <Button variant="outline">Connect</Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M8 14L10 16L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium">HubSpot</h3>
                              <p className="text-sm text-gray-500">Connect to HubSpot for client management and marketing</p>
                            </div>
                          </div>
                          <Button variant="outline">Connect</Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="payment" className="p-4 border rounded-md mt-2">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M4 15H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium">Stripe</h3>
                              <p className="text-sm text-gray-500">Accept credit card payments directly on your invoices</p>
                            </div>
                          </div>
                          <Button variant="outline">Connect</Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 11C21 14.866 17.866 18 14 18C10.134 18 7 14.866 7 11C7 7.13401 10.134 4 14 4C17.866 4 21 7.13401 21 11Z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M3 15C3 16.6569 4.34315 18 6 18C7.65685 18 9 16.6569 9 15C9 13.3431 7.65685 12 6 12C4.34315 12 3 13.3431 3 15Z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M14 20C11.7909 20 10 18.2091 10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium">PayPal</h3>
                              <p className="text-sm text-gray-500">Allow clients to pay with PayPal or credit cards</p>
                            </div>
                          </div>
                          <Button variant="outline">Connect</Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Summary</h2>
                  <p className="text-sm text-gray-500">Review your configuration and complete the setup.</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-2">Company Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Company Name</p>
                        <p className="text-sm">{companyName || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Industry</p>
                        <p className="text-sm">{industry || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Website</p>
                        <p className="text-sm">{website || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="text-sm">{address || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-2">Branding</h3>
                    <div className="flex items-center gap-4 mb-4">
                      {logo ? (
                        <img src={logo} alt="Logo" className="h-16 w-auto rounded border bg-white p-2" />
                      ) : (
                        <div className="h-16 w-16 bg-white rounded border flex items-center justify-center text-gray-400">
                          <Upload size={24} />
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Primary Color</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                            <span className="text-sm">{primaryColor}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Secondary Color</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: secondaryColor }}></div>
                            <span className="text-sm">{secondaryColor}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Integrations</h3>
                        <p className="text-sm text-gray-500">No integrations configured yet</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>Configure</Button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Ready to go!</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Your BillWise account is ready to use. Click "Complete Setup" to access your dashboard and start billing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : currentStep === steps.length - 1 ? (
                <span className="flex items-center">
                  Complete Setup <Check className="ml-2 h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
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
