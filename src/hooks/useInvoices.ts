import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  contract_id: string | null;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string | null;
  sent_at: string | null;
  place_of_supply: string | null;
  supply_type: 'intra' | 'inter' | null;
  irn: string | null;
  e_invoice_data: any | null;
  // E-Way Bill fields
  eway_bill_number: string | null;
  transport_mode: 'road' | 'rail' | 'air' | 'ship' | null;
  vehicle_number: string | null;
  transporter_name: string | null;
  transporter_gstin: string | null;
  distance_km: number | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  hsn_code?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface EWayBillFormData {
  eWayBillNumber: string;
  transportMode: 'road' | 'rail' | 'air' | 'ship' | '';
  vehicleNumber: string;
  transporterName: string;
  transporterGstin: string;
  distanceKm: number;
}

export interface InvoiceFormData {
  id?: string;
  clientId: string;
  contractId?: string;
  items: {
    id?: string;
    description: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
  }[];
  taxRate: number;
  dueDate: string;
  notes: string;
  placeOfSupply?: string;
  eWayBill?: EWayBillFormData;
}

export const useInvoices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await invoicesApi.list();
      return (response.invoices || []).map((inv: any) => ({
        id: String(inv.id),
        user_id: String(inv.userId || ''),
        client_id: String(inv.clientId || ''),
        contract_id: inv.contractId ? String(inv.contractId) : null,
        invoice_number: inv.invoiceNumber,
        subtotal: inv.subtotal || 0,
        tax_amount: inv.taxAmount || inv.tax || 0,
        total: inv.total || 0,
        issue_date: inv.issueDate || inv.createdAt,
        due_date: inv.dueDate,
        status: inv.status,
        notes: inv.notes || null,
        sent_at: inv.sentAt || null,
        place_of_supply: inv.placeOfSupply || null,
        supply_type: inv.supplyType || null,
        irn: inv.irn || null,
        e_invoice_data: inv.eInvoiceData || null,
        eway_bill_number: inv.ewayBillNumber || null,
        transport_mode: inv.transportMode || null,
        vehicle_number: inv.vehicleNumber || null,
        transporter_name: inv.transporterName || null,
        transporter_gstin: inv.transporterGstin || null,
        distance_km: inv.distanceKm || null,
        created_at: inv.createdAt,
        updated_at: inv.updatedAt,
      })) as Invoice[];
    },
    enabled: !!user,
  });

  const getInvoiceItems = async (invoiceId: string): Promise<InvoiceItem[]> => {
    const invoice = await invoicesApi.get(Number(invoiceId));
    return (invoice.items || []).map((item: any) => ({
      id: String(item.id || ''),
      invoice_id: invoiceId,
      description: item.description || '',
      hsn_code: item.hsnCode || '',
      quantity: item.quantity || 0,
      unit_price: item.unitPrice || 0,
      amount: item.amount || (item.quantity * item.unitPrice) || 0,
      created_at: '',
    }));
  };

  const useInvoiceItems = (invoiceId: string | null) => useQuery({
    queryKey: ['invoice-items', invoiceId],
    queryFn: () => getInvoiceItems(invoiceId!),
    enabled: !!invoiceId,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoiceData: InvoiceFormData) => {
      if (!user) throw new Error('User not authenticated');
      const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = subtotal * (invoiceData.taxRate / 100);
      return invoicesApi.create({
        clientId: Number(invoiceData.clientId),
        contractId: invoiceData.contractId ? Number(invoiceData.contractId) : undefined,
        items: invoiceData.items,
        subtotal,
        tax: taxAmount,
        total: subtotal + taxAmount,
        dueDate: invoiceData.dueDate,
        notes: invoiceData.notes || undefined,
        placeOfSupply: invoiceData.placeOfSupply || undefined,
        // E-Way Bill fields
        ...(invoiceData.eWayBill && {
          ewayBillNumber: invoiceData.eWayBill.eWayBillNumber || undefined,
          transportMode: invoiceData.eWayBill.transportMode || undefined,
          vehicleNumber: invoiceData.eWayBill.vehicleNumber || undefined,
          transporterName: invoiceData.eWayBill.transporterName || undefined,
          transporterGstin: invoiceData.eWayBill.transporterGstin || undefined,
          distanceKm: invoiceData.eWayBill.distanceKm || undefined,
        }),
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async (invoiceData: InvoiceFormData) => {
      if (!invoiceData.id) throw new Error('Invoice ID is required');
      const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = subtotal * (invoiceData.taxRate / 100);
      return invoicesApi.update(Number(invoiceData.id), {
        clientId: Number(invoiceData.clientId),
        items: invoiceData.items,
        subtotal,
        tax: taxAmount,
        total: subtotal + taxAmount,
        dueDate: invoiceData.dueDate,
        // E-Way Bill fields
        ...(invoiceData.eWayBill && {
          ewayBillNumber: invoiceData.eWayBill.eWayBillNumber || undefined,
          transportMode: invoiceData.eWayBill.transportMode || undefined,
          vehicleNumber: invoiceData.eWayBill.vehicleNumber || undefined,
          transporterName: invoiceData.eWayBill.transporterName || undefined,
          transporterGstin: invoiceData.eWayBill.transporterGstin || undefined,
          distanceKm: invoiceData.eWayBill.distanceKm || undefined,
        }),
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-items'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      await invoicesApi.delete(Number(invoiceId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });

  const createInvoiceFromContract = useMutation({
    mutationFn: async (contractId: string) => {
      if (!user) throw new Error('User not authenticated');
      return invoicesApi.create({
        contractId: Number(contractId),
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created from contract');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });

  const sendInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      return invoicesApi.updateStatus(Number(invoiceId), 'sent');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice sent to client');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send invoice: ${error.message}`);
    },
  });

  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: Invoice['status'] }) => {
      return invoicesApi.updateStatus(Number(invoiceId), status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update invoice status: ${error.message}`);
    },
  });

  return {
    invoices: invoicesQuery.data || [],
    isLoading: invoicesQuery.isLoading,
    error: invoicesQuery.error,
    getInvoiceItems,
    useInvoiceItems,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createInvoiceFromContract,
    sendInvoice,
    updateInvoiceStatus,
  };
};
