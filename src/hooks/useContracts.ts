import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsApi, proposalsApi } from '@/lib/api-client';
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
      const response = await contractsApi.list();
      return (response.contracts || []).map((c: any) => ({
        id: String(c.id),
        user_id: String(c.userId || ''),
        client_id: String(c.clientId || ''),
        proposal_id: c.proposalId ? String(c.proposalId) : null,
        title: c.title,
        description: c.terms || null,
        amount: c.value || 0,
        start_date: c.startDate,
        end_date: c.endDate || null,
        status: c.status,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      })) as Contract[];
    },
    enabled: !!user,
  });

  const createContract = useMutation({
    mutationFn: async (contractData: ContractFormData) => {
      if (!user) throw new Error('User not authenticated');
      return contractsApi.generate({
        proposalId: Number(contractData.proposalId) || 0,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
      });
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
      return contractsApi.update(Number(contractData.id), {
        title: contractData.title,
        terms: contractData.description || undefined,
        value: parseFloat(contractData.amount) || 0,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        status: contractData.status,
      } as any);
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
      return contractsApi.generate({
        proposalId: Number(proposalId),
        startDate: new Date().toISOString().split('T')[0],
      });
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

  const deleteContract = useMutation({
    mutationFn: async (contractId: string) => {
      await contractsApi.delete(Number(contractId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contract: ${error.message}`);
    },
  });

  return {
    contracts: contractsQuery.data || [],
    isLoading: contractsQuery.isLoading,
    error: contractsQuery.error,
    createContract,
    updateContract,
    deleteContract,
    createContractFromProposal,
  };
};
