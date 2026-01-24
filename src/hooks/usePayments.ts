import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user,
  });

  const recordPayment = useMutation({
    mutationFn: async (paymentData: PaymentFormData) => {
      if (!user) throw new Error('User not authenticated');
      
      // Create payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          invoice_id: paymentData.invoiceId,
          amount: paymentData.amount,
          payment_date: paymentData.paymentDate,
          payment_method: paymentData.paymentMethod,
          reference: paymentData.reference || null,
          notes: paymentData.notes || null,
        })
        .select()
        .single();
      
      if (paymentError) throw paymentError;
      
      // Get invoice total and sum of payments
      const { data: invoice } = await supabase
        .from('invoices')
        .select('total')
        .eq('id', paymentData.invoiceId)
        .single();
      
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', paymentData.invoiceId);
      
      const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      // Update invoice status if fully paid
      if (invoice && totalPaid >= Number(invoice.total)) {
        await supabase
          .from('invoices')
          .update({ status: 'paid' as const })
          .eq('id', paymentData.invoiceId);
      }
      
      return payment;
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

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    recordPayment,
  };
};
