import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import SkeletonLoader from '@/components/common/SkeletonLoader';

const PaymentsPage = () => {
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { clients, isLoading: clientsLoading } = useClients();

  const isLoading = paymentsLoading || invoicesLoading || clientsLoading;

  const getInvoiceNumber = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    return invoice ? invoice.invoice_number : 'Unknown';
  };

  const getClientFromInvoice = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return 'Unknown Client';
    const client = clients.find((c) => c.id === invoice.client_id);
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
      case 'cash':
        return 'Cash';
      default:
        return 'Other';
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
          <div className="text-center py-10 border rounded-md bg-muted/20">
            <p className="text-muted-foreground">No payment records found.</p>
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
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{getInvoiceNumber(payment.invoice_id)}</TableCell>
                    <TableCell>{getClientFromInvoice(payment.invoice_id)}</TableCell>
                    <TableCell>
                      ${Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                    <TableCell>{payment.reference || '-'}</TableCell>
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
