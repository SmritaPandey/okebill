import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Printer, CreditCard, Edit, Trash2, Send, Download, FileText, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SkeletonLoader from '../common/SkeletonLoader';
import { ClientFormData } from '../clients/ClientForm';
import { documentsApi } from '@/lib/api-client';
import { toast } from 'sonner';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  clientId: string;
  contractId?: string;
  amount: string;
  tax: string;
  total: string;
  issueDate: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
}

interface InvoiceListProps {
  invoices: InvoiceData[];
  clients: ClientFormData[];
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDownload: (id: string) => void;
  onRecordPayment: (id: string) => void;
  onSend?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  clients,
  onView,
  onEdit,
  onDownload,
  onRecordPayment,
  onSend,
  onDelete,
  isLoading = false,
}) => {
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => String(c.id) === String(clientId));
    return client ? client.name : 'Unknown Client';
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Draft</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sent</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const blob = await documentsApi.downloadInvoicePdf(Number(invoiceId));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice PDF downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download PDF');
    }
  };

  const handleSendEmail = async (invoiceId: string) => {
    try {
      const result = await documentsApi.sendInvoice(Number(invoiceId));
      toast.success(result.message);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invoice');
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      const result = await documentsApi.sendReminder(Number(invoiceId));
      toast.success(result.message);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reminder');
    }
  };

  if (isLoading) {
    return <SkeletonLoader count={5} className="mb-3" />;
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-gray-50">
        <p className="text-gray-500">No invoices found. Create new invoices to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoiceNumber || '—'}</TableCell>
              <TableCell>{getClientName(invoice.clientId)}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(invoice.total)}
              </TableCell>
              <TableCell>
                {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-IN') : '—'}
              </TableCell>
              <TableCell>
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '—'}
              </TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
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
                    <DropdownMenuItem onClick={() => onView(invoice.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Invoice
                    </DropdownMenuItem>
                    {onEdit && ['pending', 'draft'].includes(invoice.status) && (
                      <DropdownMenuItem onClick={() => onEdit(invoice.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Invoice
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => handleDownloadPdf(invoice.id)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownload(invoice.id)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Invoice
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {['pending', 'draft'].includes(invoice.status) && (
                      <DropdownMenuItem onClick={() => handleSendEmail(invoice.id)}>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Client
                      </DropdownMenuItem>
                    )}

                    {invoice.status === 'overdue' && (
                      <DropdownMenuItem onClick={() => handleSendReminder(invoice.id)}>
                        <Bell className="mr-2 h-4 w-4" />
                        Send Reminder
                      </DropdownMenuItem>
                    )}

                    {['pending', 'sent', 'overdue'].includes(invoice.status) && (
                      <DropdownMenuItem onClick={() => onRecordPayment(invoice.id)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Record Payment
                      </DropdownMenuItem>
                    )}

                    {onDelete && ['draft', 'cancelled'].includes(invoice.status) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(invoice.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Invoice
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceList;
