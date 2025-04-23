
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import ContractList, { ContractData } from '@/components/contracts/ContractList';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ClientFormData } from '@/components/clients/ClientForm';

// Generate mock contract data
const generateMockContracts = () => {
  return [
    {
      id: '1',
      title: 'Water Conservation System Contract',
      clientId: '4',
      amount: '15750',
      startDate: '2025-04-15',
      endDate: '2026-04-14',
      status: 'active',
      createdAt: '2025-04-10',
    },
    {
      id: '2',
      title: 'Annual Energy Supply Agreement',
      clientId: '1',
      amount: '48000',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'active',
      createdAt: '2024-12-15',
    },
    {
      id: '3',
      title: 'Data Center Cooling Solution',
      clientId: '2',
      amount: '36500',
      startDate: '2024-11-01',
      endDate: '2025-10-31',
      status: 'active',
      createdAt: '2024-10-20',
    },
  ] as ContractData[];
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

const ContractsPage = () => {
  const [contracts] = useState<ContractData[]>(generateMockContracts());
  const [clients] = useState<ClientFormData[]>(generateMockClients());
  const [isLoading, setIsLoading] = useState(false);

  const handleViewContract = (id: string) => {
    toast.info(`Viewing contract: ${id}`);
  };

  const handleCreateInvoice = (id: string) => {
    toast.success('Invoice created from contract');
  };

  return (
    <MainLayout>
      <PageHeader
        title="Contracts"
        description="Manage your active and past contracts"
        icon={FileText}
      />

      <div className="mt-6">
        <ContractList
          contracts={contracts}
          clients={clients}
          onView={handleViewContract}
          onCreateInvoice={handleCreateInvoice}
          isLoading={isLoading}
        />
      </div>
    </MainLayout>
  );
};

export default ContractsPage;
