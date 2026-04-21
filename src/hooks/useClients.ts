import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, type Client } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type { Client };

export interface ClientFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  notes: string;
}

export const useClients = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await clientsApi.list();
      return response.clients || [];
    },
    enabled: !!user,
  });

  const createClient = useMutation({
    mutationFn: async (clientData: ClientFormData) => {
      if (!user) throw new Error('User not authenticated');
      const stateCode = clientData.gstin?.length >= 2 ? clientData.gstin.substring(0, 2) : undefined;
      return clientsApi.create({
        name: clientData.name,
        contactEmail: clientData.email,
        phone: clientData.phone || undefined,
        address: clientData.address || undefined,
        gstin: clientData.gstin || undefined,
        stateCode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add client: ${error.message}`);
    },
  });

  const updateClient = useMutation({
    mutationFn: async (clientData: ClientFormData) => {
      if (!clientData.id) throw new Error('Client ID is required');
      const stateCode = clientData.gstin?.length >= 2 ? clientData.gstin.substring(0, 2) : undefined;
      return clientsApi.update(Number(clientData.id), {
        name: clientData.name,
        contactEmail: clientData.email,
        phone: clientData.phone || undefined,
        address: clientData.address || undefined,
        gstin: clientData.gstin || undefined,
        stateCode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (clientId: string) => {
      return clientsApi.delete(Number(clientId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });

  return {
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    createClient,
    updateClient,
    deleteClient,
  };
};
