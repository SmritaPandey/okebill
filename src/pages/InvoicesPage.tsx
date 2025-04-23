
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import InvoiceList, { InvoiceData } from '@/components/invoices/InvoiceList';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { ClientFormData } from '@/components/clients/ClientForm';

// Generate mock invoice data
const generateMockInvoices = () => {
  return [
    {
      id: '1',
      invoiceNumber: 'INV-2025-001',
      clientId: '4',
      contractId: '1',
      amount: '14318.18',
      tax: '1431.82',
      total: '15750.00',
      issueDate: '2025-04-15',
      dueDate: '2025-05-15',
      status: 'pending',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2025-002',
      clientId: '1',
      contractId: '2',
      amount: '4000.00',
      tax: '400.00',
      total: '4400.00',
      issueDate: '2025-04-01',
      dueDate: '2025-05-01',
      status: 'paid',
    },
    {
      id: '3',
      invoiceNumber: 'INV-2025-003',
      clientId: '2',
      contractId: '3',
      amount: '3041.67',
      tax: '304.17',
      total: '3345.84',
      issueDate: '2025-04-01',
      dueDate: '2025-05-01',
      status: 'overdue',
    },
  ] as InvoiceData[];
};

// Mock client data
const generateMockClients = () => {
  return [
    {
      id: '1',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Anytown, CA 94105',
      notes: 'Key enterprise client',
    },
    {
      id: '2',
      name: 'TechNova Solutions',
      email: 'info@technova.com',
      phone: '(555) 987-6543',
      address: '456 Innovation Dr, Tech City, CA 95123',
      notes: '',
    },
    {
      id: '3',
      name: 'EcoEnergy Co.',
      email: 'support@ecoenergy.com',
      phone: '(555) 321-7890',
      address: '789 Green Ave, Ecoville, CA 92001',
      notes: 'Interested in renewable energy options',
    },
    {
      id: '4',
      name: 'Global Manufacturing Inc.',
      email: 'info@globalmanufacturing.com',
      phone: '(555) 456-7890',
      address: '321 Factory Blvd, Industrial Park, CA 92225',
      notes: 'Large electricity consumer',
    },
  ];
};

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>(generateMockInvoices());
  const [clients] = useState<ClientFormData[]>(generateMockClients());
  const [isLoading, setIsLoading] = useState(false);

  const handleViewInvoice = (id: string) => {
    toast.info(`Viewing invoice: ${id}`);
  };

  const handleDownloadInvoice = (id: string) => {
    toast.success('Invoice PDF downloaded');
  };

  const handleRecordPayment = (id: string) => {
    setInvoices(invoices.map(invoice => 
      invoice.id === id 
        ? { ...invoice, status: 'paid' as 'pending' | 'paid' | 'overdue' | 'cancelled' } 
        : invoice
    ));
    toast.success('Payment recorded successfully');
  };

  return (
    <MainLayout>
      <PageHeader
        title="Invoices"
        description="Manage your invoices and payment status"
        icon={Receipt}
      />

      <div className="mt-6">
        <InvoiceList
          invoices={invoices}
          clients={clients}
          onView={handleViewInvoice}
          onDownload={handleDownloadInvoice}
          onRecordPayment={handleRecordPayment}
          isLoading={isLoading}
        />
      </div>
    </MainLayout>
  );
};

export default InvoicesPage;
