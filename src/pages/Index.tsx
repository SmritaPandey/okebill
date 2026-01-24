import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  FileCheck
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import SkeletonLoader from '@/components/common/SkeletonLoader';

const Dashboard = () => {
  const { stats, revenueData, invoiceStatusData, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <MainLayout>
        <PageHeader
          title="Dashboard"
          description="Overview of your business metrics"
          icon={LayoutDashboard}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonLoader key={i} className="h-32" />
          ))}
        </div>
      </MainLayout>
    );
  }

  const statCards = [
    { 
      title: 'Total Clients', 
      value: String(stats.totalClients), 
      icon: Users, 
      change: { value: stats.clientsChange, isPositive: stats.clientsChange > 0 } 
    },
    { 
      title: 'Active Proposals', 
      value: String(stats.activeProposals), 
      icon: FileText, 
      change: { value: stats.proposalsChange, isPositive: stats.proposalsChange > 0 } 
    },
    { 
      title: 'Active Contracts', 
      value: String(stats.activeContracts), 
      icon: FileCheck, 
      change: { value: stats.contractsChange, isPositive: stats.contractsChange > 0 } 
    },
    { 
      title: 'Pending Invoices', 
      value: String(stats.pendingInvoices), 
      icon: Receipt, 
      change: { value: Math.abs(stats.invoicesChange), isPositive: stats.invoicesChange <= 0 } 
    },
    { 
      title: 'Revenue (MTD)', 
      value: `$${stats.revenueThisMonth.toLocaleString()}`, 
      icon: CreditCard, 
      change: { value: stats.revenueChange, isPositive: stats.revenueChange > 0 } 
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your business metrics"
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueChart data={revenueData.length > 0 ? revenueData : undefined} />
        <StatusPieChart data={invoiceStatusData.length > 0 ? invoiceStatusData : undefined} />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
