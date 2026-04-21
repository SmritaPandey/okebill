import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import { BarChart, TrendingUp, TrendingDown, Activity, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RevenueChart from '@/components/dashboard/RevenueChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import SkeletonLoader from '@/components/common/SkeletonLoader';

const AnalyticsPage = () => {
  const { stats, revenueData, invoiceStatusData, proposalStatusData, isLoading } = useDashboardStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <PageHeader
          title="Analytics"
          description="Business performance metrics and visualizations"
          icon={BarChart}
        />
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} className="h-32" />
            ))}
          </div>
          <SkeletonLoader className="h-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonLoader className="h-64" />
            <SkeletonLoader className="h-64" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Analytics"
        description="Business performance metrics and visualizations"
        icon={BarChart}
      />

      <div className="mt-6 space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* MRR Card */}
          <Card className="bg-gradient-to-br from-emerald-500 to-[#2C4F7C] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Recurring Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(stats?.mrr || 0)}
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                From {stats?.activeContracts || 0} active contracts
              </p>
            </CardContent>
          </Card>

          {/* Churn Rate Card */}
          <Card className={`bg-gradient-to-br ${(stats?.churnRate || 0) > 10 ? 'from-amber-500 to-amber-600' : 'from-green-500 to-green-600'} text-white`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                {(stats?.churnRate || 0) > 10 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                Churn Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.churnRate || 0}%
              </div>
              <p className="text-xs text-white/80 mt-1">
                {(stats?.churnRate || 0) > 10 ? 'Needs attention' : 'Healthy retention'}
              </p>
            </CardContent>
          </Card>

          {/* Cash Flow Projection Card */}
          <Card className="bg-gradient-to-br from-[#1E3A5F] to-[#2C4F7C] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Cash Flow Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(stats?.cashFlowProjection || 0)}
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                From {stats?.pendingInvoices || 0} pending invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData.length > 0 ? revenueData : undefined} />
          </CardContent>
        </Card>

        {/* Status Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPieChart data={invoiceStatusData.length > 0 ? invoiceStatusData : undefined} title="" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposal Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPieChart data={proposalStatusData.length > 0 ? proposalStatusData : undefined} title="" />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;

