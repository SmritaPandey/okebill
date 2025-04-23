
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import ClientList from '@/components/clients/ClientList';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Generate mock client data
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

const ClientsPage = () => {
  const [clients, setClients] = useState<ClientFormData[]>(generateMockClients());
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<ClientFormData | undefined>(undefined);

  const handleCreateClient = () => {
    setCurrentClient(undefined);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: ClientFormData) => {
    setCurrentClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter(client => client.id !== id));
    toast.success('Client deleted successfully');
  };

  const handleCreateProposal = (clientId: string) => {
    // In a real app, this would navigate to the proposals page with the client preselected
    toast.info(`Create proposal for client ID: ${clientId}`);
  };

  const handleSubmitForm = (data: ClientFormData) => {
    if (data.id) {
      // Update existing client
      setClients(clients.map(client => client.id === data.id ? data : client));
      toast.success('Client updated successfully');
    } else {
      // Create new client
      const newClient = { ...data, id: String(clients.length + 1) };
      setClients([...clients, newClient]);
      toast.success('New client added successfully');
    }
    setIsFormOpen(false);
  };

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
          clients={clients}
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
