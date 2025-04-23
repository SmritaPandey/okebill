
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Sample data for the chart
const defaultData = [
  { name: 'Pending', value: 12, color: '#3B82F6' },  // blue
  { name: 'Paid', value: 30, color: '#10B981' },     // green
  { name: 'Overdue', value: 5, color: '#EF4444' },   // red
];

interface StatusPieChartProps {
  data?: Array<{ name: string; value: number; color: string }>;
  title?: string;
}

const StatusPieChart: React.FC<StatusPieChartProps> = ({
  data = defaultData,
  title = "Invoice Status",
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [value, 'Count']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0'
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusPieChart;
