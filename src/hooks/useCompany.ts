import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  address: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormData {
  name: string;
  industry: string;
  website: string;
  address: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
}

export const useCompany = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const companyQuery = useQuery({
    queryKey: ['company', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Company | null;
    },
    enabled: !!user,
  });

  const createOrUpdateCompany = useMutation({
    mutationFn: async (companyData: CompanyFormData) => {
      if (!user) throw new Error('User not authenticated');
      
      const existingCompany = companyQuery.data;
      
      if (existingCompany) {
        // Update existing company
        const { data, error } = await supabase
          .from('companies')
          .update({
            name: companyData.name,
            industry: companyData.industry || null,
            website: companyData.website || null,
            address: companyData.address || null,
            logo_url: companyData.logoUrl || null,
            primary_color: companyData.primaryColor || '#0f52ba',
            secondary_color: companyData.secondaryColor || '#6ba5e2',
          })
          .eq('id', existingCompany.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert({
            user_id: user.id,
            name: companyData.name,
            industry: companyData.industry || null,
            website: companyData.website || null,
            address: companyData.address || null,
            logo_url: companyData.logoUrl || null,
            primary_color: companyData.primaryColor || '#0f52ba',
            secondary_color: companyData.secondaryColor || '#6ba5e2',
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Company information saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save company: ${error.message}`);
    },
  });

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/logo.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) {
      toast.error(`Failed to upload logo: ${uploadError.message}`);
      return null;
    }
    
    const { data } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  };

  return {
    company: companyQuery.data,
    isLoading: companyQuery.isLoading,
    error: companyQuery.error,
    createOrUpdateCompany,
    uploadLogo,
  };
};
