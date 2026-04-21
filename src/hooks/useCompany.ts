import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, filesApi } from '@/lib/api-client';
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
  gstin: string | null;
  tan: string | null;
  cin: string | null;
  llpin: string | null;
  msme_udyam: string | null;
  fssai_license: string | null;
  iec: string | null;
  dpiit_startup: string | null;
  company_type: string | null;
  pan: string | null;
  phone: string | null;
  email: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  upi_id: string | null;
  invoice_prefix: string | null;
  invoice_footer: string | null;
  signature_url: string | null;
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
  gstin?: string;
  tan?: string;
  cin?: string;
  llpin?: string;
  msmeUdyam?: string;
  fssaiLicense?: string;
  iec?: string;
  dpiitStartup?: string;
  companyType?: string;
  pan?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankBranch?: string;
  upiId?: string;
  invoicePrefix?: string;
  invoiceFooter?: string;
  signatureUrl?: string;
}

export const useCompany = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const companyQuery = useQuery({
    queryKey: ['company', user?.id],
    queryFn: async (): Promise<Company | null> => {
      if (!user) return null;
      try {
        const settings = await settingsApi.get();
        const branding = (settings.branding || {}) as any;
        return {
          id: String(settings.id || ''),
          user_id: String(settings.userId || ''),
          name: settings.companyName || '',
          industry: branding.industry || null,
          website: branding.website || null,
          address: settings.companyAddress || null,
          logo_url: branding.logoUrl || null,
          primary_color: branding.primaryColor || '#1E3A5F',
          secondary_color: branding.secondaryColor || '#1E3A5F',
          gstin: branding.gstin || null,
          tan: branding.tan || null,
          cin: branding.cin || null,
          llpin: branding.llpin || null,
          msme_udyam: branding.msmeUdyam || null,
          fssai_license: branding.fssaiLicense || null,
          iec: branding.iec || null,
          dpiit_startup: branding.dpiitStartup || null,
          company_type: branding.companyType || null,
          pan: branding.pan || null,
          phone: settings.companyPhone || null,
          email: settings.companyEmail || null,
          bank_name: branding.bankName || null,
          bank_account: branding.bankAccount || null,
          bank_ifsc: branding.bankIfsc || null,
          bank_branch: branding.bankBranch || null,
          upi_id: branding.upiId || null,
          invoice_prefix: settings.invoicePrefix || null,
          invoice_footer: branding.invoiceFooter || null,
          signature_url: branding.signatureUrl || null,
          created_at: '',
          updated_at: '',
        };
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  const createOrUpdateCompany = useMutation({
    mutationFn: async (companyData: CompanyFormData) => {
      if (!user) throw new Error('User not authenticated');
      return settingsApi.update({
        companyName: companyData.name,
        companyEmail: companyData.email || undefined,
        companyPhone: companyData.phone || undefined,
        companyAddress: companyData.address || undefined,
        invoicePrefix: companyData.invoicePrefix || undefined,
        branding: {
          industry: companyData.industry || undefined,
          website: companyData.website || undefined,
          logoUrl: companyData.logoUrl || undefined,
          primaryColor: companyData.primaryColor || undefined,
          secondaryColor: companyData.secondaryColor || undefined,
          gstin: companyData.gstin || undefined,
          pan: companyData.pan || undefined,
          bankName: companyData.bankName || undefined,
          bankAccount: companyData.bankAccount || undefined,
          bankIfsc: companyData.bankIfsc || undefined,
          invoiceFooter: companyData.invoiceFooter || undefined,
          signatureUrl: companyData.signatureUrl || undefined,
        },
      });
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
    try {
      const response = await filesApi.upload({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        entityType: 'company-logo',
      });
      // Upload to the signed URL
      await fetch(response.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      return response.uploadUrl;
    } catch (error: any) {
      toast.error(`Failed to upload logo: ${error.message}`);
      return null;
    }
  };

  const uploadSignature = async (file: File): Promise<string | null> => {
    if (!user) return null;
    try {
      const response = await filesApi.upload({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        entityType: 'signature',
      });
      await fetch(response.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      return response.uploadUrl;
    } catch (error: any) {
      toast.error(`Failed to upload signature: ${error.message}`);
      return null;
    }
  };

  return {
    company: companyQuery.data,
    isLoading: companyQuery.isLoading,
    error: companyQuery.error,
    createOrUpdateCompany,
    uploadLogo,
    uploadSignature,
  };
};
