
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Sample data for the chart
const defaultData = [
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

interface RevenueChartProps {
  data?: Array<{ month: string; revenue: number }>;
  title?: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data = defaultData,
  title = "Monthly Revenue",
}) => {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Revenue']} 
                labelStyle={{ color: '#1e293b' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0'
                }}
              />
              <Bar 
                dataKey="revenue" 
                fill="#2563EB" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
