import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import ContractList from '@/components/contracts/ContractList';
import ContractForm from '@/components/contracts/ContractForm';
import { FileText } from 'lucide-react';
import { useContracts, ContractFormData } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ContractsPage = () => {
  const { contracts, isLoading, updateContract, deleteContract } = useContracts();
  const { clients } = useClients();
  const { createInvoiceFromContract } = useInvoices();
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editContract, setEditContract] = useState<ContractFormData | null>(null);
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);

  const handleViewContract = (id: string) => {
    setSelectedContract(id);
  };

  const handleEditContract = (contract: any) => {
    setEditContract({
      id: contract.id,
      clientId: contract.clientId,
      title: contract.title,
      description: '',
      amount: contract.amount,
      startDate: contract.startDate,
      endDate: contract.endDate || '',
      status: contract.status,
    });
    setIsFormOpen(true);
  };

  const handleDeleteContract = (id: string) => {
    setDeleteContractId(id);
  };

  const confirmDeleteContract = () => {
    if (deleteContractId) {
      deleteContract.mutate(deleteContractId);
      setDeleteContractId(null);
    }
  };

  const handleCreateInvoice = (id: string) => {
    createInvoiceFromContract.mutate(id);
  };

  const handleSubmitForm = (data: ContractFormData) => {
    if (data.id) {
      updateContract.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
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
          onEdit={handleEditContract}
          onDelete={handleDeleteContract}
          onCreateInvoice={handleCreateInvoice}
          isLoading={isLoading}
        />
      </div>

      {/* View Contract Dialog */}
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
                  <p className="text-base">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                    }).format(Number(selectedContractData.amount))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-base">{new Date(selectedContractData.start_date).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="text-base">{selectedContractData.end_date ? new Date(selectedContractData.end_date).toLocaleDateString('en-IN') : 'Ongoing'}</p>
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

      {/* Edit Contract Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Update the contract details below.
            </DialogDescription>
          </DialogHeader>
          {editContract && (
            <ContractForm
              initialData={editContract}
              clients={clientsForList}
              onSubmit={handleSubmitForm}
              onCancel={() => setIsFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteContractId} onOpenChange={() => setDeleteContractId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contract and may affect related invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteContract} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ContractsPage;
