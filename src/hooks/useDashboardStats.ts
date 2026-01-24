import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalClients: number;
  activeProposals: number;
  activeContracts: number;
  pendingInvoices: number;
  revenueThisMonth: number;
  clientsChange: number;
  proposalsChange: number;
  contractsChange: number;
  invoicesChange: number;
  revenueChange: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface StatusData {
  name: string;
  value: number;
  color: string;
}

export const useDashboardStats = () => {
  const { user } = useAuth();

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Get counts for all entities
      const [
        clientsResult,
        proposalsResult,
        contractsResult,
        invoicesResult,
        paymentsResult,
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('proposals').select('id, status', { count: 'exact' }).in('status', ['draft', 'sent']),
        supabase.from('contracts').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('invoices').select('id, total, status', { count: 'exact' }).in('status', ['draft', 'sent', 'overdue']),
        supabase.from('payments').select('amount, payment_date'),
      ]);
      
      // Calculate this month's revenue
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyPayments = paymentsResult.data?.filter(p => 
        new Date(p.payment_date) >= firstOfMonth
      ) || [];
      const revenueThisMonth = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      return {
        totalClients: clientsResult.count || 0,
        activeProposals: proposalsResult.count || 0,
        activeContracts: contractsResult.count || 0,
        pendingInvoices: invoicesResult.count || 0,
        revenueThisMonth,
        // Mock change percentages for now
        clientsChange: 12,
        proposalsChange: 8,
        contractsChange: 5,
        invoicesChange: -2,
        revenueChange: 15,
      } as DashboardStats;
    },
    enabled: !!user,
  });

  const revenueChartQuery = useQuery({
    queryKey: ['revenue-chart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .order('payment_date', { ascending: true });
      
      // Group by month
      const monthlyRevenue: { [key: string]: number } = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize all months to 0
      months.forEach(month => {
        monthlyRevenue[month] = 0;
      });
      
      payments?.forEach(payment => {
        const date = new Date(payment.payment_date);
        const month = months[date.getMonth()];
        monthlyRevenue[month] += Number(payment.amount);
      });
      
      return months.map(month => ({
        month,
        revenue: monthlyRevenue[month],
      })) as RevenueData[];
    },
    enabled: !!user,
  });

  const invoiceStatusQuery = useQuery({
    queryKey: ['invoice-status-chart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: invoices } = await supabase
        .from('invoices')
        .select('status');
      
      const statusCounts = {
        'Pending': 0,
        'Paid': 0,
        'Overdue': 0,
      };
      
      invoices?.forEach(invoice => {
        if (invoice.status === 'paid') {
          statusCounts['Paid']++;
        } else if (invoice.status === 'overdue') {
          statusCounts['Overdue']++;
        } else {
          statusCounts['Pending']++;
        }
      });
      
      return [
        { name: 'Pending', value: statusCounts['Pending'], color: '#3B82F6' },
        { name: 'Paid', value: statusCounts['Paid'], color: '#10B981' },
        { name: 'Overdue', value: statusCounts['Overdue'], color: '#EF4444' },
      ] as StatusData[];
    },
    enabled: !!user,
  });

  const proposalStatusQuery = useQuery({
    queryKey: ['proposal-status-chart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: proposals } = await supabase
        .from('proposals')
        .select('status');
      
      const statusCounts = {
        'Draft': 0,
        'Sent': 0,
        'Accepted': 0,
        'Rejected': 0,
      };
      
      proposals?.forEach(proposal => {
        if (proposal.status === 'draft') statusCounts['Draft']++;
        else if (proposal.status === 'sent') statusCounts['Sent']++;
        else if (proposal.status === 'accepted') statusCounts['Accepted']++;
        else if (proposal.status === 'rejected') statusCounts['Rejected']++;
      });
      
      return [
        { name: 'Draft', value: statusCounts['Draft'], color: '#94A3B8' },
        { name: 'Sent', value: statusCounts['Sent'], color: '#3B82F6' },
        { name: 'Accepted', value: statusCounts['Accepted'], color: '#10B981' },
        { name: 'Rejected', value: statusCounts['Rejected'], color: '#EF4444' },
      ] as StatusData[];
    },
    enabled: !!user,
  });

  return {
    stats: statsQuery.data,
    revenueData: revenueChartQuery.data || [],
    invoiceStatusData: invoiceStatusQuery.data || [],
    proposalStatusData: proposalStatusQuery.data || [],
    isLoading: statsQuery.isLoading || revenueChartQuery.isLoading,
  };
};
