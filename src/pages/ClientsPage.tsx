import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import ClientList from '@/components/clients/ClientList';
import ClientForm from '@/components/clients/ClientForm';
import { Users } from 'lucide-react';
import { useClients, ClientFormData } from '@/hooks/useClients';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ClientsPage = () => {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<ClientFormData | undefined>(undefined);
  const navigate = useNavigate();

  const handleCreateClient = () => {
    setCurrentClient(undefined);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: ClientFormData) => {
    setCurrentClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = (id: string) => {
    deleteClient.mutate(id);
  };

  const handleCreateProposal = (clientId: string) => {
    navigate('/proposals', { state: { selectedClientId: clientId } });
  };

  const handleSubmitForm = (data: ClientFormData) => {
    if (data.id) {
      updateClient.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    } else {
      createClient.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  // Transform clients for the list component
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
        title="Clients"
        description="Manage your client information"
        icon={Users}
        actionLabel="Add Client"
        onAction={handleCreateClient}
      />

      <div className="mt-6">
        <ClientList
          clients={clientsForList}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          onCreateProposal={handleCreateProposal}
          isLoading={isLoading}
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {currentClient ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
            <DialogDescription>
              {currentClient
                ? 'Update the client information below.'
                : 'Fill out the form below to add a new client.'}
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            initialData={currentClient}
            onSubmit={handleSubmitForm}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ClientsPage;
