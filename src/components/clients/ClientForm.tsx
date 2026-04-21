
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Loader2 } from 'lucide-react';

export interface ClientFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  notes: string;
}

interface GstVerifyResult {
  valid: boolean;
  gstin?: string;
  legalName?: string;
  tradeName?: string;
  address?: string;
  stateCode?: string;
  stateName?: string;
  status?: string;
  pan?: string;
  registrationType?: string;
  constitutionOfBusiness?: string;
  source?: string;
  message?: string;
}

interface ClientFormProps {
  initialData?: ClientFormData;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

const defaultFormData: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  gstin: '',
  notes: '',
};

const ClientForm: React.FC<ClientFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = React.useState<ClientFormData>(
    initialData || defaultFormData
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [gstVerifying, setGstVerifying] = React.useState(false);
  const [gstResult, setGstResult] = React.useState<GstVerifyResult | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear GST verification when GSTIN changes
    if (name === 'gstin') {
      setGstResult(null);
    }
  };

  const verifyGstin = async () => {
    const gstin = formData.gstin?.trim().toUpperCase();
    if (!gstin || gstin.length !== 15) {
      toast.error('Please enter a valid 15-character GSTIN');
      return;
    }

    setGstVerifying(true);
    setGstResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/gst/verify/${gstin}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data: GstVerifyResult = await response.json();

      if (!response.ok) {
        setGstResult({ valid: false, message: data.message || 'Verification failed' });
        toast.error(data.message || 'Invalid GSTIN');
        return;
      }

      setGstResult(data);

      // Auto-fill form fields from GST data
      if (data.valid) {
        const updates: Partial<ClientFormData> = {};

        if (data.legalName && (!formData.name || formData.name.trim() === '')) {
          updates.name = data.tradeName || data.legalName;
        }
        if (data.address && (!formData.address || formData.address.trim() === '')) {
          updates.address = data.address;
        }

        if (Object.keys(updates).length > 0) {
          setFormData(prev => ({ ...prev, ...updates }));
          toast.success('GSTIN verified! Company details auto-filled.');
        } else {
          toast.success(`GSTIN verified — ${data.status || 'Active'}`);
        }
      }
    } catch (err: any) {
      setGstResult({ valid: false, message: 'Network error — could not verify GSTIN' });
      toast.error('Failed to verify GSTIN. Check your connection.');
    } finally {
      setGstVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required fields');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(formData);
      setIsSubmitting(false);
    }, 500);
  };

  const getGstStatusBadge = () => {
    if (!gstResult) return null;

    if (!gstResult.valid) {
      return (
        <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-1">
          <ShieldX className="w-3.5 h-3.5" />
          <span>{gstResult.message || 'Invalid GSTIN'}</span>
        </div>
      );
    }

    const status = gstResult.status?.toLowerCase() || '';
    if (status.includes('active')) {
      return (
        <div className="space-y-1 mt-1">
          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Active — Verified</span>
          </div>
          {gstResult.legalName && (
            <div className="text-xs text-muted-foreground">
              <strong>Legal Name:</strong> {gstResult.legalName}
              {gstResult.tradeName && gstResult.tradeName !== gstResult.legalName && (
                <> | <strong>Trade:</strong> {gstResult.tradeName}</>
              )}
            </div>
          )}
          {gstResult.stateName && (
            <div className="text-xs text-muted-foreground">
              <strong>State:</strong> {gstResult.stateName} ({gstResult.stateCode})
              {gstResult.constitutionOfBusiness && (
                <> | <strong>Type:</strong> {gstResult.constitutionOfBusiness}</>
              )}
            </div>
          )}
          {gstResult.source === 'derived' && (
            <div className="text-xs text-amber-600">
              ⓘ Format valid. API unavailable — details entered manually.
            </div>
          )}
        </div>
      );
    }

    if (status.includes('cancelled') || status.includes('suspended')) {
      return (
        <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium mt-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{gstResult.status} — This GSTIN is not active</span>
        </div>
      );
    }

    // Format valid but no live status
    return (
      <div className="space-y-1 mt-1">
        <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>{gstResult.status || 'Checksum Valid'}</span>
        </div>
        {gstResult.message && (
          <div className="text-xs text-muted-foreground">{gstResult.message}</div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Client' : 'Add New Client'}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* GSTIN — first, so auto-fill can populate fields below */}
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN</Label>
            <div className="flex gap-2">
              <Input
                id="gstin"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="font-mono uppercase tracking-wider"
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={verifyGstin}
                disabled={gstVerifying || !formData.gstin || formData.gstin.length < 15}
                className="whitespace-nowrap"
              >
                {gstVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-1" />
                    Verify GSTIN
                  </>
                )}
              </Button>
            </div>
            {getGstStatusBadge()}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Company Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@company.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full address"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional information about this client"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-navy hover:bg-brand-navy-dark"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update Client' : 'Add Client'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ClientForm;
