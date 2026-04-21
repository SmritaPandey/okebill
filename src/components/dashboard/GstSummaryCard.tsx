import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee } from 'lucide-react';

interface GstSummaryProps {
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalTax?: number;
  period?: string;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const GstSummaryCard: React.FC<GstSummaryProps> = ({ cgst = 0, sgst = 0, igst = 0, totalTax = 0, period }) => {
  const items = [
    { label: 'CGST', amount: cgst, color: '#1E3A5F' },
    { label: 'SGST', amount: sgst, color: '#10B981' },
    { label: 'IGST', amount: igst, color: '#0ea5e9' },
  ];
  const total = totalTax || (cgst + sgst + igst);

  return (
    <Card className="border-gray-200/60 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
          <IndianRupee size={16} className="text-teal-500" />
          GST Liability
          {period && <span className="text-xs font-normal text-gray-400 ml-auto">{period}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-gray-900">{formatINR(total)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Total Tax Collected</div>
        </div>

        {/* Stacked bar */}
        <div className="h-3 flex rounded-full overflow-hidden bg-gray-100 mb-4">
          {items.map(item => {
            const pct = total > 0 ? (item.amount / total) * 100 : 33;
            return (
              <div
                key={item.label}
                style={{ width: `${pct}%`, backgroundColor: item.color }}
                className="transition-all duration-500"
              />
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {items.map(item => (
            <div key={item.label} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
              <div className="text-sm font-bold text-gray-800">{formatINR(item.amount)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GstSummaryCard;
