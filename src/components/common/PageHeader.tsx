
import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  extraActions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  extraActions
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center">
        {Icon && (
          <div className="mr-3 p-2 bg-brand-navy/10 rounded-md text-brand-navy">
            <Icon size={24} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="bg-brand-navy hover:bg-brand-navy-dark">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
