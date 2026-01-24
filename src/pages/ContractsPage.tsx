import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import ContractList from '@/components/contracts/ContractList';
import { FileText } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ContractsPage = () => {
  const { contracts, isLoading } = useContracts();
  const { clients } = useClients();
  const { createInvoiceFromContract } = useInvoices();
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  const handleViewContract = (id: string) => {
    setSelectedContract(id);
  };

  const handleCreateInvoice = (id: string) => {
    createInvoiceFromContract.mutate(id);
  };

  // Transform contracts for the list component
  const contractsForList = contracts.map(contract => ({
    id: contract.id,
    title: contract.title,
    clientId: contract.client_id,
    amount: String(contract.amount),
    startDate: contract.start_date,
    endDate: contract.end_date || '',
    status: contract.status,
    createdAt: contract.created_at.split('T')[0],
  }));

  // Transform clients for the list
  const clientsForList = clients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    address: client.address || '',
    notes: client.notes || '',
  }));

  const selectedContractData = contracts.find(c => c.id === selectedContract);

  return (
    <MainLayout>
      <PageHeader
        title="Contracts"
        description="Manage your active and past contracts"
        icon={FileText}
      />

      <div className="mt-6">
        <ContractList
          contracts={contractsForList}
          clients={clientsForList}
          onView={handleViewContract}
          onCreateInvoice={handleCreateInvoice}
          isLoading={isLoading}
        />
      </div>

      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
            <DialogDescription>
              View contract information
            </DialogDescription>
          </DialogHeader>
          {selectedContractData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="text-base">{selectedContractData.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-base">${Number(selectedContractData.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-base">{new Date(selectedContractData.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="text-base">{selectedContractData.end_date ? new Date(selectedContractData.end_date).toLocaleDateString() : 'Ongoing'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-base capitalize">{selectedContractData.status}</p>
                </div>
              </div>
              {selectedContractData.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-base">{selectedContractData.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ContractsPage;
