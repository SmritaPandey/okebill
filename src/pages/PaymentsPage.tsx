import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Trash2 } from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PaymentsPage = () => {
  const { payments, isLoading: paymentsLoading, deletePayment } = usePayments();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { clients, isLoading: clientsLoading } = useClients();
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  const isLoading = paymentsLoading || invoicesLoading || clientsLoading;

  const getInvoiceNumber = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    return invoice ? invoice.invoice_number : 'Unknown';
  };

  const getClientFromInvoice = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return 'Unknown Client';
    const client = clients.find((c) => String(c.id) === invoice.client_id);
    return client ? client.name : 'Unknown Client';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
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
      case 'upi':
        return 'UPI';
      default:
        return 'Other';
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      bank_transfer: 'bg-slate-50 text-slate-700 border-slate-200',
      credit_card: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      upi: 'bg-green-50 text-green-700 border-green-200',
      cash: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      check: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return (
      <Badge variant="outline" className={colors[method] || 'bg-gray-50 text-gray-700'}>
        {getPaymentMethodLabel(method)}
      </Badge>
    );
  };

  const handleDeletePayment = (id: string) => {
    setDeletePaymentId(id);
  };

  const confirmDeletePayment = () => {
    if (deletePaymentId) {
      deletePayment.mutate(deletePaymentId);
      setDeletePaymentId(null);
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
            <p className="text-muted-foreground">No payment records found. Record payments from the Invoices page.</p>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{getInvoiceNumber(payment.invoice_id)}</TableCell>
                    <TableCell>{getClientFromInvoice(payment.invoice_id)}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>{getPaymentMethodBadge(payment.payment_method)}</TableCell>
                    <TableCell>{payment.reference || '-'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <span className="sr-only">Open menu</span>
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                            >
                              <path
                                d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment record and may change the invoice status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePayment} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default PaymentsPage;
