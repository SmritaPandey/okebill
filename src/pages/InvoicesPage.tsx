import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import InvoiceList from '@/components/invoices/InvoiceList';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import RecordPaymentModal from '@/components/invoices/RecordPaymentModal';
import InvoiceViewModal from '@/components/invoices/InvoiceViewModal';
import { Receipt } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const InvoicesPage = () => {
  const { invoices, isLoading, createInvoice, sendInvoice } = useInvoices();
  const { clients } = useClients();
  const { recordPayment } = usePayments();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [recordPaymentInvoiceId, setRecordPaymentInvoiceId] = useState<string | null>(null);

  const handleCreateInvoice = () => {
    setIsFormOpen(true);
  };

  const handleViewInvoice = (id: string) => {
    setViewInvoiceId(id);
  };

  const handleDownloadInvoice = (id: string) => {
    // For now, just show a message. Full PDF generation would require a library like jsPDF
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice) {
      // Create a simple text download for now
      const client = clients.find(c => c.id === invoice.client_id);
      const content = `
Invoice: ${invoice.invoice_number}
Client: ${client?.name || 'Unknown'}
Issue Date: ${invoice.issue_date}
Due Date: ${invoice.due_date}
Subtotal: $${Number(invoice.subtotal).toFixed(2)}
Tax: $${Number(invoice.tax_amount).toFixed(2)}
Total: $${Number(invoice.total).toFixed(2)}
Status: ${invoice.status}
      `.trim();
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleRecordPayment = (id: string) => {
    setRecordPaymentInvoiceId(id);
  };

  const handleSendInvoice = (id: string) => {
    sendInvoice.mutate(id);
  };

  // Transform invoices for the list component
  const invoicesForList = invoices.map(invoice => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    clientId: invoice.client_id,
    contractId: invoice.contract_id || undefined,
    amount: String(invoice.subtotal),
    tax: String(invoice.tax_amount),
    total: String(invoice.total),
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    status: invoice.status === 'sent' ? 'pending' as const : invoice.status === 'draft' ? 'pending' as const : invoice.status as 'pending' | 'paid' | 'overdue' | 'cancelled',
  }));

  // Transform clients for the list
  const clientsForList = clients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    address: client.address || '',
    notes: client.notes || '',
  }));

  const selectedInvoice = invoices.find(inv => inv.id === viewInvoiceId);
  const paymentInvoice = invoices.find(inv => inv.id === recordPaymentInvoiceId);

  return (
    <MainLayout>
      <PageHeader
        title="Invoices"
        description="Manage your invoices and payment status"
        icon={Receipt}
        actionLabel="Create Invoice"
        onAction={handleCreateInvoice}
      />

      <div className="mt-6">
        <InvoiceList
          invoices={invoicesForList}
          clients={clientsForList}
          onView={handleViewInvoice}
          onDownload={handleDownloadInvoice}
          onRecordPayment={handleRecordPayment}
          onSend={handleSendInvoice}
          isLoading={isLoading}
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new invoice.
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            clients={clientsForList}
            onSubmit={(data) => {
              createInvoice.mutate(data, {
                onSuccess: () => setIsFormOpen(false),
              });
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {selectedInvoice && (
        <InvoiceViewModal
          isOpen={!!viewInvoiceId}
          onClose={() => setViewInvoiceId(null)}
          invoice={selectedInvoice}
          client={clients.find(c => c.id === selectedInvoice.client_id)}
        />
      )}

      {paymentInvoice && (
        <RecordPaymentModal
          isOpen={!!recordPaymentInvoiceId}
          onClose={() => setRecordPaymentInvoiceId(null)}
          invoice={paymentInvoice}
          onSubmit={(data) => {
            recordPayment.mutate(data, {
              onSuccess: () => setRecordPaymentInvoiceId(null),
            });
          }}
        />
      )}
    </MainLayout>
  );
};

export default InvoicesPage;
