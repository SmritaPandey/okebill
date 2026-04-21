
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  accent?: 'emerald' | 'navy' | 'rose' | 'amber' | 'sky' | 'teal';
  className?: string;
}

const accentStyles: Record<string, { bg: string; ring: string; text: string }> = {
  emerald: { bg: 'from-emerald-50 to-emerald-100/50', ring: 'ring-emerald-100', text: 'text-emerald-600' },
  navy: { bg: 'from-blue-50 to-blue-100/50', ring: 'ring-blue-100', text: 'text-[#1E3A5F]' },
  rose: { bg: 'from-rose-50 to-rose-100/50', ring: 'ring-rose-100', text: 'text-rose-600' },
  amber: { bg: 'from-amber-50 to-amber-100/50', ring: 'ring-amber-100', text: 'text-amber-600' },
  sky: { bg: 'from-sky-50 to-sky-100/50', ring: 'ring-sky-100', text: 'text-sky-600' },
  teal: { bg: 'from-teal-50 to-teal-100/50', ring: 'ring-teal-100', text: 'text-teal-600' },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  subtitle,
  accent = 'emerald',
  className
}) => {
  const style = accentStyles[accent];

  return (
    <Card className={cn(
      "overflow-hidden border-gray-200/60 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{title}</p>
            <h3 className="mt-1.5 text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>

            {change && (
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-xs font-semibold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                    change.isPositive
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-700 bg-rose-50"
                  )}
                >
                  {change.isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(change.value)}%
                </span>
                <span className="text-xs text-gray-400">vs last month</span>
              </div>
            )}

            {subtitle && (
              <p className="mt-1.5 text-xs text-gray-400">{subtitle}</p>
            )}
          </div>

          <div className={cn("p-2.5 bg-gradient-to-br rounded-xl ring-1", style.bg, style.ring, style.text)}>
            <Icon size={20} strokeWidth={1.8} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
