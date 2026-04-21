import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CashFlowChartProps {
  monthlyRevenue?: Array<{ month: string; year: number; revenue: number }>;
  projection?: { next30: number; next60: number; next90: number; total: number };
}

const formatINR = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

const formatINRFull = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const CashFlowChart: React.FC<CashFlowChartProps> = ({ monthlyRevenue = [], projection }) => {
  return (
    <Card className="col-span-1 md:col-span-2 border-gray-200/60 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" />
            Cash Flow
          </CardTitle>
          {projection && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-400">Next 30 days</div>
                <div className="text-sm font-bold text-emerald-600">{formatINRFull(projection.next30)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Next 90 days</div>
                <div className="text-sm font-bold text-gray-700">{formatINRFull(projection.total)}</div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={formatINR}
                width={55}
              />
              <Tooltip
                formatter={(value: number) => [formatINRFull(value), 'Revenue']}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                contentStyle={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  padding: '8px 12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#cashFlowGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
