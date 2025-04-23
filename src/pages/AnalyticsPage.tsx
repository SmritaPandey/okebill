
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/common/PageHeader';
import { BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RevenueChart from '@/components/dashboard/RevenueChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';

// Sample data for charts
const revenueData = [
  { month: 'Jan', revenue: 12000 },
  { month: 'Feb', revenue: 19000 },
  { month: 'Mar', revenue: 15000 },
  { month: 'Apr', revenue: 22000 },
  { month: 'May', revenue: 18000 },
  { month: 'Jun', revenue: 25000 },
  { month: 'Jul', revenue: 20000 },
  { month: 'Aug', revenue: 28000 },
  { month: 'Sep', revenue: 23000 },
  { month: 'Oct', revenue: 30000 },
  { month: 'Nov', revenue: 26000 },
  { month: 'Dec', revenue: 35000 },
];

const invoiceStatusData = [
  { name: 'Pending', value: 12, color: '#3B82F6' },
  { name: 'Paid', value: 30, color: '#10B981' },
  { name: 'Overdue', value: 5, color: '#EF4444' },
];

const proposalStatusData = [
  { name: 'Draft', value: 8, color: '#94A3B8' },
  { name: 'Sent', value: 15, color: '#3B82F6' },
  { name: 'Accepted', value: 12, color: '#10B981' },
  { name: 'Rejected', value: 3, color: '#EF4444' },
];

const AnalyticsPage = () => {
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
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPieChart data={invoiceStatusData} title="" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposal Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPieChart data={proposalStatusData} title="" />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;
