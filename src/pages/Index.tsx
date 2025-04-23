
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
  FileCheck,
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';

const Dashboard = () => {
  // Mock data for now - in a real app this would come from an API
  const stats = [
    { title: 'Total Clients', value: '24', icon: Users, change: { value: 12, isPositive: true } },
    { title: 'Active Proposals', value: '16', icon: FileText, change: { value: 8, isPositive: true } },
    { title: 'Contracts', value: '10', icon: FileCheck, change: { value: 5, isPositive: true } },
    { title: 'Pending Invoices', value: '8', icon: Receipt, change: { value: 2, isPositive: false } },
    { title: 'Revenue (MTD)', value: '$42,500', icon: CreditCard, change: { value: 15, isPositive: true } },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your business metrics"
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {stats.map((stat, index) => (
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
        <RevenueChart />
        <StatusPieChart />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
