
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const defaultData = [
  { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 },
  { month: 'Mar', revenue: 0 }, { month: 'Apr', revenue: 0 },
  { month: 'May', revenue: 0 }, { month: 'Jun', revenue: 0 },
  { month: 'Jul', revenue: 0 }, { month: 'Aug', revenue: 0 },
  { month: 'Sep', revenue: 0 }, { month: 'Oct', revenue: 0 },
  { month: 'Nov', revenue: 0 }, { month: 'Dec', revenue: 0 },
];

const formatINR = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

interface RevenueChartProps {
  data?: Array<{ month: string; revenue: number }>;
  title?: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data = defaultData,
  title = "Monthly Revenue",
}) => {
  return (
    <Card className="col-span-1 md:col-span-2 border-gray-200/60 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A5F" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(value) => formatINR(value)}
                width={55}
              />
              <Tooltip
                formatter={(value: number) => [formatINR(value), 'Revenue']}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                contentStyle={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  padding: '8px 12px',
                }}
              />
              <Bar
                dataKey="revenue"
                fill="url(#revenueGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
