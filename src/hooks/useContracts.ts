import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Contract {
  id: string;
  user_id: string;
  client_id: string;
  proposal_id: string | null;
  title: string;
  description: string | null;
  amount: number;
  start_date: string;
  end_date: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ContractFormData {
  id?: string;
  clientId: string;
  proposalId?: string;
  title: string;
  description: string;
  amount: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

export const useContracts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!user,
  });

  const createContract = useMutation({
    mutationFn: async (contractData: ContractFormData) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          user_id: user.id,
          client_id: contractData.clientId,
          proposal_id: contractData.proposalId || null,
          title: contractData.title,
          description: contractData.description || null,
          amount: parseFloat(contractData.amount) || 0,
          start_date: contractData.startDate,
          end_date: contractData.endDate || null,
          status: contractData.status || 'draft',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create contract: ${error.message}`);
    },
  });

  const updateContract = useMutation({
    mutationFn: async (contractData: ContractFormData) => {
      if (!contractData.id) throw new Error('Contract ID is required');
      const { data, error } = await supabase
        .from('contracts')
        .update({
          client_id: contractData.clientId,
          title: contractData.title,
          description: contractData.description || null,
          amount: parseFloat(contractData.amount) || 0,
          start_date: contractData.startDate,
          end_date: contractData.endDate || null,
          status: contractData.status,
        })
        .eq('id', contractData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contract: ${error.message}`);
    },
  });

  const createContractFromProposal = useMutation({
    mutationFn: async (proposalId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // Get the proposal
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();
      
      if (proposalError) throw proposalError;
      
      // Create contract from proposal
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          user_id: user.id,
          client_id: proposal.client_id,
          proposal_id: proposalId,
          title: proposal.title,
          description: proposal.description,
          amount: proposal.amount,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active' as const,
        })
        .select()
        .single();
      
      if (contractError) throw contractError;
      
      // Update proposal status to accepted
      await supabase
        .from('proposals')
        .update({ status: 'accepted' as const })
        .eq('id', proposalId);
      
      return contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Contract created from proposal');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create contract: ${error.message}`);
    },
  });

  return {
    contracts: contractsQuery.data || [],
    isLoading: contractsQuery.isLoading,
    error: contractsQuery.error,
    createContract,
    updateContract,
    createContractFromProposal,
  };
};
