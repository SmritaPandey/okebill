
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Send, FileCheck, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProposalFormData } from './ProposalForm';
import SkeletonLoader from '../common/SkeletonLoader';
import { ClientFormData } from '../clients/ClientForm';

interface ProposalListProps {
  proposals: ProposalFormData[];
  clients: ClientFormData[];
  onEdit: (proposal: ProposalFormData) => void;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
  onConvertToContract: (id: string) => void;
  isLoading?: boolean;
}

const ProposalList: React.FC<ProposalListProps> = ({
  proposals,
  clients,
  onEdit,
  onDelete,
  onSend,
  onConvertToContract,
  isLoading = false,
}) => {
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => String(c.id) === String(clientId));
    return client ? client.name : 'Unknown Client';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Draft</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Sent</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <SkeletonLoader count={5} className="mb-3" />;
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-gray-50">
        <p className="text-gray-500">No proposals found. Create a new proposal to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Valid Until</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((proposal) => (
            <TableRow key={proposal.id}>
              <TableCell className="font-medium">{proposal.title}</TableCell>
              <TableCell>{getClientName(proposal.clientId)}</TableCell>
              <TableCell>
                {proposal.amount ? `$${parseFloat(proposal.amount).toFixed(2)}` : '—'}
              </TableCell>
              <TableCell>
                {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString() : '—'}
              </TableCell>
              <TableCell>{getStatusBadge(proposal.status)}</TableCell>
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
                    <DropdownMenuItem onClick={() => onEdit(proposal)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>

                    {proposal.status === 'draft' && (
                      <DropdownMenuItem onClick={() => onSend(proposal.id!)}>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Client
                      </DropdownMenuItem>
                    )}

                    {(proposal.status === 'sent' || proposal.status === 'accepted') && (
                      <DropdownMenuItem onClick={() => {
                        const publicUrl = `${window.location.origin}/p/${proposal.id}`;
                        navigator.clipboard.writeText(publicUrl);
                        toast.success('Link copied to clipboard!');
                      }}>
                        <Link2 className="mr-2 h-4 w-4" />
                        Copy Shareable Link
                      </DropdownMenuItem>
                    )}

                    {proposal.status === 'accepted' && (
                      <DropdownMenuItem onClick={() => onConvertToContract(proposal.id!)}>
                        <FileCheck className="mr-2 h-4 w-4" />
                        Convert to Contract
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(proposal.id!)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
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

export default ProposalList;
