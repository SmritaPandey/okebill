import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Proposal {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description: string | null;
  service_type: string | null;
  amount: number;
  tax_rate: number;
  valid_until: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalFormData {
  id?: string;
  clientId: string;
  title: string;
  description: string;
  serviceType: string;
  amount: string;
  taxRate: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
}

export const useProposals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const proposalsQuery = useQuery({
    queryKey: ['proposals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Proposal[];
    },
    enabled: !!user,
  });

  const createProposal = useMutation({
    mutationFn: async (proposalData: ProposalFormData) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          user_id: user.id,
          client_id: proposalData.clientId,
          title: proposalData.title,
          description: proposalData.description || null,
          service_type: proposalData.serviceType || null,
          amount: parseFloat(proposalData.amount) || 0,
          tax_rate: parseFloat(proposalData.taxRate) || 0,
          valid_until: proposalData.validUntil || null,
          status: proposalData.status || 'draft',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create proposal: ${error.message}`);
    },
  });

  const updateProposal = useMutation({
    mutationFn: async (proposalData: ProposalFormData) => {
      if (!proposalData.id) throw new Error('Proposal ID is required');
      const { data, error } = await supabase
        .from('proposals')
        .update({
          client_id: proposalData.clientId,
          title: proposalData.title,
          description: proposalData.description || null,
          service_type: proposalData.serviceType || null,
          amount: parseFloat(proposalData.amount) || 0,
          tax_rate: parseFloat(proposalData.taxRate) || 0,
          valid_until: proposalData.validUntil || null,
          status: proposalData.status,
        })
        .eq('id', proposalData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update proposal: ${error.message}`);
    },
  });

  const deleteProposal = useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete proposal: ${error.message}`);
    },
  });

  const sendProposal = useMutation({
    mutationFn: async (proposalId: string) => {
      const { data, error } = await supabase
        .from('proposals')
        .update({
          status: 'sent' as const,
          sent_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal sent to client');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send proposal: ${error.message}`);
    },
  });

  return {
    proposals: proposalsQuery.data || [],
    isLoading: proposalsQuery.isLoading,
    error: proposalsQuery.error,
    createProposal,
    updateProposal,
    deleteProposal,
    sendProposal,
  };
};
