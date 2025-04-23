
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { ClientFormData } from '@/components/clients/ClientForm';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface PaymentData {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'check' | 'other';
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
}

// Generate mock payment data
const generateMockPayments = () => {
  return [
    {
      id: '1',
      invoiceId: '2',
      invoiceNumber: 'INV-2025-002',
      clientId: '1',
      amount: '4400.00',
      paymentDate: '2025-04-20',
      paymentMethod: 'bank_transfer',
      status: 'completed',
      transactionId: 'TRX-98765432',
    },
    {
      id: '2',
      invoiceId: '4',
      invoiceNumber: 'INV-2025-004',
      clientId: '3',
      amount: '2800.00',
      paymentDate: '2025-04-15',
      paymentMethod: 'credit_card',
      status: 'completed',
      transactionId: 'TRX-12345678',
    },
    {
      id: '3',
      invoiceId: '5',
      invoiceNumber: 'INV-2025-005',
      clientId: '2',
      amount: '1500.00',
      paymentDate: '2025-04-10',
      paymentMethod: 'check',
      status: 'pending',
      transactionId: 'TRX-24680135',
    },
  ] as PaymentData[];
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

const PaymentsPage = () => {
  const [payments] = useState<PaymentData[]>(generateMockPayments());
  const [clients] = useState<ClientFormData[]>(generateMockClients());
  const [isLoading, setIsLoading] = useState(false);

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'check':
        return 'Check';
      default:
        return 'Other';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <PageHeader
          title="Payments"
          description="Track and manage invoice payments"
          icon={CreditCard}
        />
        <div className="mt-6">
          <SkeletonLoader count={5} className="mb-3" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Payments"
        description="Track and manage invoice payments"
        icon={CreditCard}
      />

      <div className="mt-6">
        {payments.length === 0 ? (
          <div className="text-center py-10 border rounded-md bg-gray-50">
            <p className="text-gray-500">No payment records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.invoiceNumber}</TableCell>
                    <TableCell>{getClientName(payment.clientId)}</TableCell>
                    <TableCell>
                      ${parseFloat(payment.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                    <TableCell>{payment.transactionId}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PaymentsPage;
