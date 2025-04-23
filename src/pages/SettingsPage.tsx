
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile settings saved successfully');
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Company settings saved successfully');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification preferences updated');
  };

  return (
    <MainLayout>
      <PageHeader
        title="Settings"
        description="Manage account settings and preferences"
        icon={Settings}
      />

      <div className="mt-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
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
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue="john.doe@example.com" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" defaultValue="Admin" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      defaultValue="Energy industry professional with 10+ years of experience."
                    />
                  </div>
                  
                  <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>
                  Manage your company information and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveCompany} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" defaultValue="BillWise Energy Solutions" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                      <Input id="taxId" defaultValue="US123456789" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Address</Label>
                    <Textarea
                      id="companyAddress"
                      rows={2}
                      defaultValue="123 Business Plaza, Suite 400, San Francisco, CA 94105"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Phone</Label>
                      <Input id="companyPhone" defaultValue="(800) 555-1234" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email</Label>
                      <Input id="companyEmail" type="email" defaultValue="info@billwise.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyWebsite">Website</Label>
                      <Input id="companyWebsite" defaultValue="www.billwise.com" />
                    </div>
                  </div>
                  
                  <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
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
                        <p className="text-sm text-gray-500">
                          Receive notifications when a new client registers
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Proposal Accepted</Label>
                        <p className="text-sm text-gray-500">
                          Receive notifications when a proposal is accepted
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Payment Received</Label>
                        <p className="text-sm text-gray-500">
                          Receive notifications when a payment is received
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Invoice Overdue</Label>
                        <p className="text-sm text-gray-500">
                          Receive notifications when an invoice becomes overdue
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Weekly Summary</Label>
                        <p className="text-sm text-gray-500">
                          Receive a weekly summary of activity
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  
                  <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark">
                    Save Preferences
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
