import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proposalsApi } from '@/lib/api-client';
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
      const response = await proposalsApi.list();
      return (response.proposals || []).map((p: any) => ({
        id: String(p.id),
        user_id: String(p.userId || ''),
        client_id: String(p.clientId || ''),
        title: p.title,
        description: p.notes || null,
        service_type: null,
        amount: p.total || 0,
        tax_rate: 0,
        valid_until: p.validUntil || null,
        status: p.status,
        sent_at: null,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })) as Proposal[];
    },
    enabled: !!user,
  });

  const createProposal = useMutation({
    mutationFn: async (proposalData: ProposalFormData) => {
      if (!user) throw new Error('User not authenticated');
      return proposalsApi.create({
        clientId: Number(proposalData.clientId),
        title: proposalData.title,
        notes: proposalData.description || undefined,
        total: parseFloat(proposalData.amount) || 0,
        validUntil: proposalData.validUntil || undefined,
        status: proposalData.status || 'draft',
      } as any);
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
      return proposalsApi.update(Number(proposalData.id), {
        title: proposalData.title,
        notes: proposalData.description || undefined,
        total: parseFloat(proposalData.amount) || 0,
        validUntil: proposalData.validUntil || undefined,
        status: proposalData.status,
      } as any);
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
      await proposalsApi.delete(Number(proposalId));
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
      return proposalsApi.updateStatus(Number(proposalId), 'sent');
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
