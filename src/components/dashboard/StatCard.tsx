
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  className
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">{value}</h3>
            
            {change && (
              <div className="mt-1 flex items-center">
                <span
                  className={cn(
                    "text-xs font-medium inline-flex items-center",
                    change.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {change.isPositive ? "↑" : "↓"} {Math.abs(change.value)}%
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          
          <div className="p-2 bg-brand-blue/10 rounded-md text-brand-blue">
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
