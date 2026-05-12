import React, { useState, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import ProposalList from '@/components/proposals/ProposalList';
import ProposalForm from '@/components/proposals/ProposalForm';
import { FileText } from 'lucide-react';
import { useProposals, ProposalFormData } from '@/hooks/useProposals';
import { useClients } from '@/hooks/useClients';
import { useContracts } from '@/hooks/useContracts';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ProposalsPage = () => {
  const { proposals, isLoading, createProposal, updateProposal, deleteProposal, sendProposal } = useProposals();
  const { clients } = useClients();
  const { createContractFromProposal } = useContracts();
  const { token } = useAuth();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<ProposalFormData | undefined>(undefined);

  const handleCreateProposal = () => {
    setCurrentProposal(undefined);
    setIsFormOpen(true);
  };

  const handleEditProposal = (proposal: ProposalFormData) => {
    setCurrentProposal(proposal);
    setIsFormOpen(true);
  };

  const handleDeleteProposal = (id: string) => {
    deleteProposal.mutate(id);
  };

  const handleSendProposal = (id: string) => {
    sendProposal.mutate(id);
  };

  const handleConvertToContract = (id: string) => {
    createContractFromProposal.mutate(id);
  };

  const handleConvertToInvoice = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API}/proposals/${id}/convert-to-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taxRate: 18 }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Proposal converted to invoice!');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Conversion failed');
      }
    } catch {
      toast.error('Network error');
    }
  }, [API, token]);

  const handleSubmitForm = (data: ProposalFormData) => {
    if (data.id) {
      updateProposal.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    } else {
      createProposal.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  // Transform proposals for the list component
  const proposalsForList = proposals.map(proposal => ({
    id: proposal.id,
    title: proposal.title,
    clientId: proposal.client_id,
    description: proposal.description || '',
    validUntil: proposal.valid_until || '',
    amount: String(proposal.amount),
    taxRate: String(proposal.tax_rate),
    serviceType: proposal.service_type || '',
    status: proposal.status,
  }));

  // Transform clients for the form/list
  const clientsForList = clients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    address: client.address || '',
    notes: client.notes || '',
  }));

  return (
    <MainLayout>
      <PageHeader
        title="Proposals"
        description="Create and manage proposals for your clients"
        icon={FileText}
        actionLabel="Create Proposal"
        onAction={handleCreateProposal}
      />

      <div className="mt-6">
        <ProposalList
          proposals={proposalsForList}
          clients={clientsForList}
          onEdit={handleEditProposal}
          onDelete={handleDeleteProposal}
          onSend={handleSendProposal}
          onConvertToContract={handleConvertToContract}
          onConvertToInvoice={handleConvertToInvoice}
          isLoading={isLoading}
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {currentProposal ? 'Edit Proposal' : 'Create New Proposal'}
            </DialogTitle>
            <DialogDescription>
              {currentProposal
                ? 'Update the proposal details below.'
                : 'Fill out the form below to create a new proposal.'}
            </DialogDescription>
          </DialogHeader>
          <ProposalForm
            initialData={currentProposal}
            clients={clientsForList}
            onSubmit={handleSubmitForm}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ProposalsPage;
