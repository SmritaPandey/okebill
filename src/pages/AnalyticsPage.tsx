import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import { BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RevenueChart from '@/components/dashboard/RevenueChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import SkeletonLoader from '@/components/common/SkeletonLoader';

const AnalyticsPage = () => {
  const { revenueData, invoiceStatusData, proposalStatusData, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <MainLayout>
        <PageHeader
          title="Analytics"
          description="Business performance metrics and visualizations"
          icon={BarChart}
        />
        <div className="mt-6 space-y-6">
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
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData.length > 0 ? revenueData : undefined} />
          </CardContent>
        </Card>

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
