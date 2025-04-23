
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Users, FileText, 
  Receipt, BarChart, FileText as ContractsIcon, 
  CreditCard, Settings, Menu, X
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const isMobile = useIsMobile();

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Proposals', href: '/proposals', icon: FileText },
    { name: 'Contracts', href: '/contracts', icon: ContractsIcon },
    { name: 'Invoices', href: '/invoices', icon: Receipt },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Analytics', href: '/analytics', icon: BarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out",
          "flex flex-col border-r border-gray-200",
          isMobile ? (open ? "translate-x-0 w-64" : "-translate-x-full") : (open ? "w-64" : "w-20"),
          isMobile ? "mt-14" : "mt-16"
        )}
      >
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex-1 py-4 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  isActive
                    ? "bg-brand-blue-light/10 text-brand-blue"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all",
                  !open && "justify-center"
                )}
              >
                <item.icon 
                  className={cn(
                    "flex-shrink-0 h-5 w-5 mr-3", 
                    !open && "mr-0"
                  )} 
                />
                {(open || !isMobile) && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
