import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import OverdueAlerts from '@/components/dashboard/OverdueAlerts';
import GstSummaryCard from '@/components/dashboard/GstSummaryCard';
import ClientRevenueChart from '@/components/dashboard/ClientRevenueChart';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import SkeletonLoader from '@/components/common/SkeletonLoader';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const Dashboard = () => {
  const { stats, kpi, aging, cashFlow, topClients, revenueData, invoiceStatusData, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <MainLayout>
        <PageHeader
          title="Dashboard"
          description="Overview of your business metrics"
          icon={LayoutDashboard}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonLoader key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonLoader className="h-72 col-span-2" />
          <SkeletonLoader className="h-72" />
        </div>
      </MainLayout>
    );
  }

  const statCards = [
    {
      title: 'Revenue (MTD)',
      value: formatINR(kpi?.revenueThisMonth || stats.revenueThisMonth),
      icon: CreditCard,
      accent: 'emerald' as const,
      change: { value: Math.abs(kpi?.revenueChange || stats.revenueChange), isPositive: (kpi?.revenueChange || stats.revenueChange) > 0 },
    },
    {
      title: 'Outstanding',
      value: formatINR(kpi?.outstanding || 0),
      icon: IndianRupee,
      accent: 'amber' as const,
      subtitle: `${kpi?.overdueCount || 0} overdue`,
    },
    {
      title: 'Overdue',
      value: formatINR(kpi?.overdueAmount || 0),
      icon: AlertTriangle,
      accent: 'rose' as const,
      subtitle: `${kpi?.overdueCount || 0} invoices past due`,
    },
    {
      title: 'Total Clients',
      value: String(kpi?.totalClients || stats.totalClients),
      icon: Users,
      accent: 'sky' as const,
      change: {
        value: Math.abs(kpi?.clientsChange || stats.clientsChange),
        isPositive: (kpi?.clientsChange || stats.clientsChange) >= 0,
      },
    },
    {
      title: 'Total Invoices',
      value: String(kpi?.totalInvoices || 0),
      icon: FileText,
      accent: 'emerald' as const,
      change: {
        value: Math.abs(kpi?.invoicesChange || stats.invoicesChange),
        isPositive: (kpi?.invoicesChange || stats.invoicesChange) >= 0,
      },
    },
    {
      title: 'Cash Flow (30d)',
      value: formatINR(cashFlow?.projection?.next30 || stats.cashFlowProjection),
      icon: TrendingUp,
      accent: 'sky' as const,
      subtitle: `${formatINR(cashFlow?.projection?.total || 0)} projected (90d)`,
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your business metrics"
        icon={LayoutDashboard}
      />

      {/* ═══════ Row 1: KPI Cards ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            accent={stat.accent}
            change={stat.change}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      {/* ═══════ Row 2: Revenue Chart + Invoice Status ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <RevenueChart data={revenueData.length > 0 ? revenueData : undefined} />
        <StatusPieChart data={invoiceStatusData.length > 0 ? invoiceStatusData : undefined} />
      </div>

      {/* ═══════ Row 3: Cash Flow + Aging + GST Summary ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CashFlowChart
          monthlyRevenue={cashFlow?.monthlyRevenue}
          projection={cashFlow?.projection}
        />
        <OverdueAlerts
          buckets={aging?.buckets}
          totals={aging?.totals}
        />
      </div>

      {/* ═══════ Row 4: Top Clients + GST Liability ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ClientRevenueChart clients={topClients} />
        <GstSummaryCard
          cgst={kpi?.gstLiability?.cgst}
          sgst={kpi?.gstLiability?.sgst}
          igst={kpi?.gstLiability?.igst}
          totalTax={kpi?.gstLiability?.total}
        />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
