import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function dashboardFetch<T>(path: string): Promise<T> {
  const token = getAuthToken();
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

// ─── Types ────────────────────────────────────────────────
export interface DashboardKPI {
  totalClients: number;
  clientsChange: number;
  revenueThisMonth: number;
  revenueChange: number;
  outstanding: number;
  overdueCount: number;
  overdueAmount: number;
  totalInvoices: number;
  invoicesChange: number;
  gstLiability: { total: number; cgst: number; sgst: number; igst: number };
}

export interface AgingData {
  buckets: {
    current: any[];
    '0_30': any[];
    '30_60': any[];
    '60_90': any[];
    '90_plus': any[];
  };
  totals: Record<string, number>;
  totalOutstanding: number;
}

export interface CashFlowData {
  projection: { next30: number; next60: number; next90: number; beyond: number; total: number };
  monthlyRevenue: Array<{ month: string; year: number; revenue: number }>;
}

export interface TopClientsData {
  clients: Array<{ id: number; name: string; totalRevenue: number; invoiceCount: number }>;
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

// ─── Combined Hook ────────────────────────────────────────
export const useDashboardStats = () => {
  const { user } = useAuth();

  // KPI data from new endpoint
  const kpiQuery = useQuery({
    queryKey: ['dashboard-kpi', user?.id],
    queryFn: () => dashboardFetch<DashboardKPI>('/dashboard/kpi'),
    enabled: !!user,
    staleTime: 30000,
  });

  // Aging analysis
  const agingQuery = useQuery({
    queryKey: ['dashboard-aging', user?.id],
    queryFn: () => dashboardFetch<AgingData>('/dashboard/aging'),
    enabled: !!user,
    staleTime: 60000,
  });

  // Cash flow
  const cashFlowQuery = useQuery({
    queryKey: ['dashboard-cashflow', user?.id],
    queryFn: () => dashboardFetch<CashFlowData>('/dashboard/cashflow'),
    enabled: !!user,
    staleTime: 60000,
  });

  // Top clients
  const topClientsQuery = useQuery({
    queryKey: ['dashboard-top-clients', user?.id],
    queryFn: () => dashboardFetch<TopClientsData>('/dashboard/top-clients'),
    enabled: !!user,
    staleTime: 60000,
  });

  // Invoice status distribution (from existing invoices API)
  const invoiceStatusQuery = useQuery({
    queryKey: ['invoice-status-chart', user?.id],
    queryFn: async (): Promise<StatusData[]> => {
      if (!user) return [];
      try {
        const data = await dashboardFetch<{ invoices: any[]; total: number }>('/invoices?limit=1000');
        const statusCounts = { Draft: 0, Sent: 0, Paid: 0, Overdue: 0, Cancelled: 0 };
        (data.invoices || []).forEach((inv: any) => {
          if (inv.status === 'paid') statusCounts.Paid++;
          else if (inv.status === 'overdue') statusCounts.Overdue++;
          else if (inv.status === 'draft') statusCounts.Draft++;
          else if (inv.status === 'cancelled') statusCounts.Cancelled++;
          else statusCounts.Sent++;
        });
        return [
          { name: 'Draft', value: statusCounts.Draft, color: '#94a3b8' },
          { name: 'Sent', value: statusCounts.Sent, color: '#3b82f6' },
          { name: 'Paid', value: statusCounts.Paid, color: '#10b981' },
          { name: 'Overdue', value: statusCounts.Overdue, color: '#ef4444' },
          { name: 'Cancelled', value: statusCounts.Cancelled, color: '#6b7280' },
        ].filter(s => s.value > 0);
      } catch {
        return [];
      }
    },
    enabled: !!user,
  });

  // Backward compatibility: construct old stats shape from KPI data
  const kpi = kpiQuery.data;
  const stats = kpi ? {
    totalClients: kpi.totalClients,
    activeProposals: 0,
    activeContracts: 0,
    pendingInvoices: kpi.overdueCount,
    revenueThisMonth: kpi.revenueThisMonth,
    clientsChange: kpi.clientsChange,
    proposalsChange: 0,
    contractsChange: 0,
    invoicesChange: kpi.invoicesChange,
    revenueChange: kpi.revenueChange,
    mrr: 0,
    churnRate: 0,
    cashFlowProjection: cashFlowQuery.data?.projection?.total || 0,
  } : null;

  return {
    // Legacy
    stats,
    revenueData: (cashFlowQuery.data?.monthlyRevenue || []).map(m => ({ month: m.month, revenue: m.revenue })),
    invoiceStatusData: invoiceStatusQuery.data || [],
    proposalStatusData: [],
    isLoading: kpiQuery.isLoading,
    // New
    kpi: kpiQuery.data,
    aging: agingQuery.data,
    cashFlow: cashFlowQuery.data,
    topClients: topClientsQuery.data?.clients || [],
  };
};
