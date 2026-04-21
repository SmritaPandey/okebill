import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, Send } from 'lucide-react';

interface AgingBucket {
  label: string;
  count: number;
  amount: number;
  color: string;
  bgColor: string;
}

interface OverdueAlertsProps {
  buckets?: {
    current: any[];
    '0_30': any[];
    '30_60': any[];
    '60_90': any[];
    '90_plus': any[];
  };
  totals?: Record<string, number>;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const OverdueAlerts: React.FC<OverdueAlertsProps> = ({ buckets, totals }) => {
  const data: AgingBucket[] = [
    { label: 'Current', count: buckets?.current?.length || 0, amount: totals?.current || 0, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    { label: '0-30 Days', count: buckets?.['0_30']?.length || 0, amount: totals?.['0_30'] || 0, color: 'text-amber-700', bgColor: 'bg-amber-50' },
    { label: '30-60 Days', count: buckets?.['30_60']?.length || 0, amount: totals?.['30_60'] || 0, color: 'text-orange-700', bgColor: 'bg-orange-50' },
    { label: '60-90 Days', count: buckets?.['60_90']?.length || 0, amount: totals?.['60_90'] || 0, color: 'text-red-600', bgColor: 'bg-red-50' },
    { label: '90+ Days', count: buckets?.['90_plus']?.length || 0, amount: totals?.['90_plus'] || 0, color: 'text-red-800', bgColor: 'bg-red-100' },
  ];

  const totalOutstanding = data.reduce((s, d) => s + d.amount, 0);

  return (
    <Card className="border-gray-200/60 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Aging Analysis
          </CardTitle>
          <span className="text-xs font-bold text-gray-900">{formatINR(totalOutstanding)}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {data.map((bucket) => {
            const pct = totalOutstanding > 0 ? (bucket.amount / totalOutstanding) * 100 : 0;
            return (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className={`text-xs font-medium w-20 ${bucket.color}`}>{bucket.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${bucket.bgColor.replace('bg-', 'bg-')}`}
                    style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: bucket.color.includes('emerald') ? '#10b981' : bucket.color.includes('amber') ? '#f59e0b' : bucket.color.includes('orange') ? '#f97316' : bucket.color.includes('red-800') ? '#991b1b' : '#ef4444' }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{bucket.count}</span>
                <span className={`text-xs font-semibold w-24 text-right ${bucket.color}`}>
                  {formatINR(bucket.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default OverdueAlerts;
