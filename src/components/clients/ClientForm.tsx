
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export interface ClientFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      onSubmit(formData);
      setIsSubmitting(false);
    }, 500);
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
                placeholder="+1 (555) 123-4567"
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
            className="bg-brand-blue hover:bg-brand-blue-dark"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update Client' : 'Add Client'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ClientForm;
