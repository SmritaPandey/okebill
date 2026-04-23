import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, LogOut, Building2, CreditCard, FileText, Upload, AlertTriangle, Trash2, Loader2, Key, Download, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/hooks/useCompany';
import { settingsApi, authApi } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import SignaturePad from '@/components/common/SignaturePad';

const SettingsPage = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { company, createOrUpdateCompany, uploadLogo, uploadSignature } = useCompany();
  const navigate = useNavigate();

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Company basic info
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1E3A5F');
  const [secondaryColor, setSecondaryColor] = useState('#6ba5e2');

  // Business details
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  // Bank details
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Invoice settings
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Data export
  const [isExporting, setIsExporting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmEmail !== user.email) {
      toast.error('Email does not match your account email');
      return;
    }
    if (!deletePassword) {
      toast.error('Password is required');
      return;
    }
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/settings/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to delete account');
        return;
      }
      toast.success('Account permanently deleted. Goodbye!');
      signOut();
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setEmail(profile.email || user?.email || '');
    }
  }, [profile, user]);

  useEffect(() => {
    if (company) {
      setCompanyName(company.name || '');
      setIndustry(company.industry || '');
      setWebsite(company.website || '');
      setAddress(company.address || '');
      setPrimaryColor(company.primary_color || '#1E3A5F');
      setSecondaryColor(company.secondary_color || '#6ba5e2');
      setGstin(company.gstin || '');
      setPan(company.pan || '');
      setCompanyPhone(company.phone || '');
      setCompanyEmail(company.email || '');
      setBankName(company.bank_name || '');
      setBankAccount(company.bank_account || '');
      setBankIfsc(company.bank_ifsc || '');
      setInvoicePrefix(company.invoice_prefix || 'INV');
      setInvoiceFooter(company.invoice_footer || '');
      setLogoUrl(company.logo_url || '');
      setSignatureUrl(company.signature_url || '');
    }
  }, [company]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await settingsApi.update({
        companyName: undefined, // Only update profile fields
      });
      await refreshProfile();
      toast.success('Profile settings saved successfully');
    } catch (error: any) {
      toast.error(`Failed to save profile: ${error.message}`);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrUpdateCompany.mutateAsync({
        name: companyName,
        industry,
        website,
        address,
        logoUrl,
        primaryColor,
        secondaryColor,
        gstin,
        pan,
        phone: companyPhone,
        email: companyEmail,
        bankName,
        bankAccount,
        bankIfsc,
        invoicePrefix,
        invoiceFooter,
        signatureUrl,
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadLogo(file);
      if (url) {
        setLogoUrl(url);
        toast.success('Logo uploaded successfully');
      }
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadSignature(file);
      if (url) {
        setSignatureUrl(url);
        toast.success('Signature uploaded successfully');
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification preferences updated');
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Settings"
          description="Manage account settings and preferences"
          icon={Settings}
        />
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account" className="text-emerald-600 data-[state=active]:text-emerald-700">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your personal information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <Button type="submit">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company">
            <div className="space-y-6">
              {/* Basic Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Basic details about your company that appear on invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveCompany} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyAddress">Address</Label>
                      <Textarea
                        id="companyAddress"
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Full business address"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyPhone">Phone</Label>
                        <Input
                          id="companyPhone"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyEmail">Email</Label>
                        <Input
                          id="companyEmail"
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          placeholder="billing@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyWebsite">Website</Label>
                        <Input
                          id="companyWebsite"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://www.company.com"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-3">Tax Information</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="gstin">GSTIN</Label>
                          <Input
                            id="gstin"
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                            placeholder="27AABCU9603R1ZM"
                            maxLength={15}
                          />
                          <p className="text-xs text-muted-foreground">15-character GST Identification Number</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pan">PAN</Label>
                          <Input
                            id="pan"
                            value={pan}
                            onChange={(e) => setPan(e.target.value.toUpperCase())}
                            placeholder="AABCU9603R"
                            maxLength={10}
                          />
                          <p className="text-xs text-muted-foreground">10-character PAN Number</p>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={createOrUpdateCompany.isPending}>
                      {createOrUpdateCompany.isPending ? 'Saving...' : 'Save Company Details'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Bank Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Bank Details
                  </CardTitle>
                  <CardDescription>
                    Bank account details for receiving payments (shown on invoices)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveCompany} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="State Bank of India"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankIfsc">IFSC Code</Label>
                        <Input
                          id="bankIfsc"
                          value={bankIfsc}
                          onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                          placeholder="SBIN0001234"
                          maxLength={11}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Account Number</Label>
                      <Input
                        id="bankAccount"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="1234567890123456"
                      />
                    </div>

                    <Button type="submit" disabled={createOrUpdateCompany.isPending}>
                      {createOrUpdateCompany.isPending ? 'Saving...' : 'Save Bank Details'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Branding Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>
                    Customize how your invoices look
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveCompany} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                          />
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                          />
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Company Logo</Label>
                        <div className="flex items-center gap-3">
                          {logoUrl && (
                            <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded border" />
                          )}
                          <Label htmlFor="logo-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50">
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">Upload Logo</span>
                            </div>
                            <Input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                            />
                          </Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Digital Signature</Label>
                        <SignaturePad
                          value={signatureUrl}
                          onChange={(dataUrl) => {
                            setSignatureUrl(dataUrl);
                            toast.success('Signature saved — click "Save Branding" to persist');
                          }}
                          onClear={() => {
                            setSignatureUrl('');
                          }}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={createOrUpdateCompany.isPending}>
                      {createOrUpdateCompany.isPending ? 'Saving...' : 'Save Branding'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoice Tab */}
          <TabsContent value="invoice">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Settings
                </CardTitle>
                <CardDescription>
                  Customize invoice numbering and footer text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveCompany} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                      <Input
                        id="invoicePrefix"
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                        placeholder="INV"
                        maxLength={10}
                      />
                      <p className="text-xs text-muted-foreground">
                        Invoices will be numbered as {invoicePrefix}-2026-00001
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceFooter">Invoice Footer Text</Label>
                    <Textarea
                      id="invoiceFooter"
                      rows={3}
                      value={invoiceFooter}
                      onChange={(e) => setInvoiceFooter(e.target.value)}
                      placeholder="Thank you for your business! Payment is due within 30 days."
                    />
                    <p className="text-xs text-muted-foreground">
                      This text appears at the bottom of every invoice
                    </p>
                  </div>

                  <Button type="submit" disabled={createOrUpdateCompany.isPending}>
                    {createOrUpdateCompany.isPending ? 'Saving...' : 'Save Invoice Settings'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveNotifications} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Notifications</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">New Client Registration</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when a new client registers
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Proposal Accepted</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when a proposal is accepted
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Payment Received</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when a payment is received
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Invoice Overdue</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when an invoice becomes overdue
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Weekly Summary</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive a weekly summary of activity
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <Button type="submit">
                    Save Preferences
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Account / Danger Zone Tab ─── */}
          {/* Change Password Card */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-[#1E3A5F]" />
                  <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>Update your account password. Must be at least 8 characters.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!currentPassword || !newPassword) { toast.error('Fill in all password fields'); return; }
                  if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
                  if (newPassword !== confirmNewPassword) { toast.error('New passwords do not match'); return; }
                  setIsChangingPassword(true);
                  try {
                    const result = await authApi.changePassword({ currentPassword, newPassword });
                    if (result.token) localStorage.setItem('auth_token', result.token);
                    toast.success('Password changed successfully');
                    setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
                  } catch (err: any) { toast.error(err.message || 'Failed to change password'); }
                  finally { setIsChangingPassword(false); }
                }} className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="current-pw">Current Password</Label>
                    <Input id="current-pw" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="new-pw">New Password</Label>
                    <Input id="new-pw" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="confirm-pw">Confirm New Password</Label>
                    <Input id="confirm-pw" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
                  </div>
                  <Button type="submit" disabled={isChangingPassword} className="gap-2">
                    {isChangingPassword ? <><Loader2 className="h-4 w-4 animate-spin" /> Changing...</> : <><Key className="h-4 w-4" /> Change Password</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Data Export Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-emerald-600" />
                  <CardTitle>Export My Data</CardTitle>
                </div>
                <CardDescription>
                  Download all your data as a JSON file. This includes your profile, invoices, clients, products, and settings.
                  <br /><span className="text-xs text-slate-400">DPDP Act 2023 — Right to Data Portability</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  disabled={isExporting}
                  className="gap-2"
                  onClick={async () => {
                    setIsExporting(true);
                    try {
                      const token = localStorage.getItem('auth_token');
                      const resp = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/auth/export-data', {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (!resp.ok) throw new Error('Export failed');
                      const blob = await resp.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `okebill-data-export-${Date.now()}.json`;
                      document.body.appendChild(a); a.click(); a.remove();
                      URL.revokeObjectURL(url);
                      toast.success('Data exported successfully');
                    } catch (err: any) { toast.error(err.message || 'Failed to export data'); }
                    finally { setIsExporting(false); }
                  }}
                >
                  {isExporting ? <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</> : <><Download className="h-4 w-4" /> Download My Data (JSON)</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-700">Danger Zone</CardTitle>
                </div>
                <CardDescription>
                  Irreversible actions that will permanently affect your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50/50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-red-800">Delete Account</h4>
                      <p className="text-sm text-red-600 mt-1">
                        Permanently delete your account and all associated data including invoices,
                        clients, proposals, and settings. This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteModal(true)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-amber-200 rounded-lg bg-amber-50/50">
                  <h4 className="font-semibold text-amber-800">Sign Out</h4>
                  <p className="text-sm text-amber-600 mt-1">
                    Sign out of your account on this device.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => { signOut(); navigate('/'); }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 border border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-500">This action is permanent and cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> Deleting your account will permanently remove all your data including
                  invoices, clients, proposals, products, subscriptions, and settings.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="confirm-email" className="text-sm font-medium">
                    Type <span className="font-mono text-red-600">{user?.email}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-email"
                    value={deleteConfirmEmail}
                    onChange={e => setDeleteConfirmEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Enter your password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteConfirmEmail('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={isDeleting || deleteConfirmEmail !== user?.email || !deletePassword}
                  onClick={handleDeleteAccount}
                >
                  {isDeleting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
                  ) : (
                    <><Trash2 className="h-4 w-4 mr-2" /> Permanently Delete</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
