
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import ProposalList from '@/components/proposals/ProposalList';
import ProposalForm, { ProposalFormData } from '@/components/proposals/ProposalForm';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClientFormData } from '@/components/clients/ClientForm';

// Generate mock proposal data
const generateMockProposals = () => {
  return [
    {
      id: '1',
      title: 'Energy Efficiency Package',
      clientId: '1',
      description: 'Comprehensive energy efficiency upgrade for corporate headquarters',
      validUntil: '2025-08-31',
      amount: '25000',
      taxRate: '10',
      serviceType: 'energy',
      status: 'draft',
    },
    {
      id: '2',
      title: 'Solar Installation Project',
      clientId: '3',
      description: 'Installation of rooftop solar panels with battery storage',
      validUntil: '2025-09-15',
      amount: '42500',
      taxRate: '10',
      serviceType: 'energy',
      status: 'sent',
    },
    {
      id: '3',
      title: 'Water Conservation System',
      clientId: '4',
      description: 'Factory-wide water recycling and conservation system',
      validUntil: '2025-07-30',
      amount: '15750',
      taxRate: '10',
      serviceType: 'water',
      status: 'accepted',
    },
  ] as ProposalFormData[];
};

// Mock client data
const generateMockClients = () => {
  return [
    {
      id: '1',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Anytown, CA 94105',
      notes: 'Key enterprise client',
    },
    {
      id: '2',
      name: 'TechNova Solutions',
      email: 'info@technova.com',
      phone: '(555) 987-6543',
      address: '456 Innovation Dr, Tech City, CA 95123',
      notes: '',
    },
    {
      id: '3',
      name: 'EcoEnergy Co.',
      email: 'support@ecoenergy.com',
      phone: '(555) 321-7890',
      address: '789 Green Ave, Ecoville, CA 92001',
      notes: 'Interested in renewable energy options',
    },
    {
      id: '4',
      name: 'Global Manufacturing Inc.',
      email: 'info@globalmanufacturing.com',
      phone: '(555) 456-7890',
      address: '321 Factory Blvd, Industrial Park, CA 92225',
      notes: 'Large electricity consumer',
    },
  ];
};

const ProposalsPage = () => {
  const [proposals, setProposals] = useState<ProposalFormData[]>(generateMockProposals());
  const [clients] = useState<ClientFormData[]>(generateMockClients());
  const [isLoading, setIsLoading] = useState(false);
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
    setProposals(proposals.filter(proposal => proposal.id !== id));
    toast.success('Proposal deleted successfully');
  };

  const handleSendProposal = (id: string) => {
    setProposals(proposals.map(proposal => 
      proposal.id === id 
        ? { ...proposal, status: 'sent' as 'draft' | 'sent' | 'accepted' | 'rejected' } 
        : proposal
    ));
    toast.success('Proposal sent to client');
  };

  const handleConvertToContract = (id: string) => {
    toast.success('Proposal converted to contract');
  };

  const handleSubmitForm = (data: ProposalFormData) => {
    if (data.id) {
      // Update existing proposal
      setProposals(proposals.map(proposal => proposal.id === data.id ? data : proposal));
      toast.success('Proposal updated successfully');
    } else {
      // Create new proposal
      const newProposal = { ...data, id: String(proposals.length + 1) };
      setProposals([...proposals, newProposal]);
      toast.success('New proposal created successfully');
    }
    setIsFormOpen(false);
  };

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
          proposals={proposals}
          clients={clients}
          onEdit={handleEditProposal}
          onDelete={handleDeleteProposal}
          onSend={handleSendProposal}
          onConvertToContract={handleConvertToContract}
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
            clients={clients}
            onSubmit={handleSubmitForm}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ProposalsPage;
