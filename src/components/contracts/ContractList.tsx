
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SkeletonLoader from '../common/SkeletonLoader';
import { ClientFormData } from '../clients/ClientForm';

export interface ContractData {
  id: string;
  title: string;
  clientId: string;
  amount: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'terminated';
  createdAt: string;
}

interface ContractListProps {
  contracts: ContractData[];
  clients: ClientFormData[];
  onView: (id: string) => void;
  onCreateInvoice: (id: string) => void;
  isLoading?: boolean;
}

const ContractList: React.FC<ContractListProps> = ({
  contracts,
  clients,
  onView,
  onCreateInvoice,
  isLoading = false,
}) => {
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Expired</Badge>;
      case 'terminated':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <SkeletonLoader count={5} className="mb-3" />;
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-gray-50">
        <p className="text-gray-500">No contracts found. Convert an accepted proposal to a contract to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">{contract.title}</TableCell>
              <TableCell>{getClientName(contract.clientId)}</TableCell>
              <TableCell>
                {contract.amount ? `$${parseFloat(contract.amount).toFixed(2)}` : '—'}
              </TableCell>
              <TableCell>
                {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : '—'}
              </TableCell>
              <TableCell>
                {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '—'}
              </TableCell>
              <TableCell>{getStatusBadge(contract.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <span className="sr-only">Open menu</span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(contract.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Contract
                    </DropdownMenuItem>
                    
                    {contract.status === 'active' && (
                      <DropdownMenuItem onClick={() => onCreateInvoice(contract.id)}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Create Invoice
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContractList;
