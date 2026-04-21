import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import InvoiceList from '@/components/invoices/InvoiceList';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import RecordPaymentModal from '@/components/invoices/RecordPaymentModal';
import InvoiceViewModal from '@/components/invoices/InvoiceViewModal';
import InvoicePrintView from '@/components/invoices/InvoicePrintView';
import ImportInvoicesDialog from '@/components/invoices/ImportInvoicesDialog';
import { Receipt, Upload } from 'lucide-react';
import { useInvoices, InvoiceFormData } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const InvoicesPage = () => {
  const { invoices, isLoading, createInvoice, updateInvoice, deleteInvoice, sendInvoice, getInvoiceItems } = useInvoices();
  const { clients } = useClients();
  const { recordPayment } = usePayments();
  const { company } = useCompany();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<InvoiceFormData | null>(null);
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);
  const [printItems, setPrintItems] = useState<any[]>([]);
  const [recordPaymentInvoiceId, setRecordPaymentInvoiceId] = useState<string | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleCreateInvoice = () => {
    setEditInvoice(null);
    setIsFormOpen(true);
  };

  const handleEditInvoice = async (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;

    // Fetch invoice items
    const items = await getInvoiceItems(id);

    const taxRate = invoice.subtotal > 0
      ? (Number(invoice.tax_amount) / Number(invoice.subtotal)) * 100
      : 18;

    setEditInvoice({
      id: invoice.id,
      clientId: invoice.client_id,
      contractId: invoice.contract_id || undefined,
      items: items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      taxRate,
      dueDate: invoice.due_date,
      notes: invoice.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleViewInvoice = (id: string) => {
    setViewInvoiceId(id);
  };

  const handlePrintInvoice = async (id: string) => {
    const items = await getInvoiceItems(id);
    setPrintItems(items);
    setPrintInvoiceId(id);
  };

  const handleRecordPayment = (id: string) => {
    setRecordPaymentInvoiceId(id);
  };

  const handleSendInvoice = (id: string) => {
    sendInvoice.mutate(id);
  };

  const handleDeleteInvoice = (id: string) => {
    setDeleteInvoiceId(id);
  };

  const confirmDeleteInvoice = () => {
    if (deleteInvoiceId) {
      deleteInvoice.mutate(deleteInvoiceId);
      setDeleteInvoiceId(null);
    }
  };

  const handleSubmitForm = (data: InvoiceFormData) => {
    if (data.id) {
      updateInvoice.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    } else {
      createInvoice.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
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
    id: String(client.id),
    name: client.name,
    email: (client as any).email || client.contactEmail || '',
    phone: client.phone || '',
    address: client.address || '',
    gstin: client.gstin || '',
    stateCode: client.stateCode || '',
    notes: (client as any).notes || '',
  }));

  const companyStateCode = company?.gstin?.substring(0, 2) || '';

  const selectedInvoice = invoices.find(inv => inv.id === viewInvoiceId);
  const printInvoice = invoices.find(inv => inv.id === printInvoiceId);
  const paymentInvoice = invoices.find(inv => inv.id === recordPaymentInvoiceId);

  return (
    <MainLayout>
      <PageHeader
        title="Invoices"
        description="Manage your invoices and payment status"
        icon={Receipt}
        actionLabel="Create Invoice"
        onAction={handleCreateInvoice}
        extraActions={
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        }
      />

      <div className="mt-6">
        <InvoiceList
          invoices={invoicesForList}
          clients={clientsForList}
          onView={handleViewInvoice}
          onEdit={handleEditInvoice}
          onDownload={handlePrintInvoice}
          onRecordPayment={handleRecordPayment}
          onSend={handleSendInvoice}
          onDelete={handleDeleteInvoice}
          isLoading={isLoading}
        />
      </div>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {editInvoice ? 'Update the invoice details below.' : 'Fill out the form below to create a new invoice.'}
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            clients={clientsForList}
            initialData={editInvoice || undefined}
            onSubmit={handleSubmitForm}
            onCancel={() => setIsFormOpen(false)}
            companyStateCode={companyStateCode}
          />
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      {selectedInvoice && (
        <InvoiceViewModal
          isOpen={!!viewInvoiceId}
          onClose={() => setViewInvoiceId(null)}
          invoice={selectedInvoice}
          client={clients.find(c => c.id === selectedInvoice.client_id)}
          onPrint={() => handlePrintInvoice(selectedInvoice.id)}
        />
      )}

      {/* Print Invoice View */}
      {printInvoice && (
        <InvoicePrintView
          invoice={printInvoice}
          items={printItems}
          client={clients.find(c => c.id === printInvoice.client_id)}
          company={company}
          onClose={() => {
            setPrintInvoiceId(null);
            setPrintItems([]);
          }}
        />
      )}

      {/* Record Payment Modal */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice and all associated items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteInvoice} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <ImportInvoicesDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </MainLayout>
  );
};

export default InvoicesPage;
