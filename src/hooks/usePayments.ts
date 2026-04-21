import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other';
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface PaymentFormData {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other';
  reference: string;
  notes: string;
}

export const usePayments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await paymentsApi.list();
      return (response.payments || []).map((p: any) => ({
        id: String(p.id),
        user_id: '',
        invoice_id: String(p.invoiceId || p.transactionId || ''),
        amount: p.amount || 0,
        payment_date: p.paymentDate,
        payment_method: p.paymentMethod || 'other',
        reference: p.notes || null,
        notes: p.notes || null,
        created_at: p.createdAt,
      })) as Payment[];
    },
    enabled: !!user,
  });

  const recordPayment = useMutation({
    mutationFn: async (paymentData: PaymentFormData) => {
      if (!user) throw new Error('User not authenticated');
      return paymentsApi.record({
        invoiceId: Number(paymentData.invoiceId),
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate,
        notes: paymentData.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      await paymentsApi.delete(Number(paymentId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete payment: ${error.message}`);
    },
  });

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    recordPayment,
    deletePayment,
  };
};
