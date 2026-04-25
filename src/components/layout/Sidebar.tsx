import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, FileText,
  Receipt, BarChart, FileCheck,
  CreditCard, Settings, X, ChevronLeft, ChevronRight,
  Package, Warehouse, ShoppingCart, TrendingUp,
  UserCheck, Truck, PieChart, Crown, RotateCcw, Wallet
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
}

interface NavSection {
  label: string;
  items: { name: string; href: string; icon: React.ElementType }[];
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Billing',
    items: [
      { name: 'Clients', href: '/clients', icon: Users },
      { name: 'Proposals', href: '/proposals', icon: FileText },
      { name: 'Contracts', href: '/contracts', icon: FileCheck },
      { name: 'Invoices', href: '/invoices', icon: Receipt },
      { name: 'Payments', href: '/payments', icon: CreditCard },
      { name: 'Credit Notes', href: '/credit-notes', icon: RotateCcw },
      { name: 'Expenses', href: '/expenses', icon: Wallet },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { name: 'Products', href: '/products', icon: Package },
      { name: 'Inventory', href: '/inventory', icon: Warehouse },
      { name: 'POS', href: '/pos', icon: ShoppingCart },
      { name: 'Sales', href: '/sales', icon: TrendingUp },
      { name: 'Customers', href: '/customers', icon: UserCheck },
      { name: 'Suppliers', href: '/suppliers', icon: Truck },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Reports', href: '/reports', icon: PieChart },
      { name: 'Analytics', href: '/analytics', icon: BarChart },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Billing & Plans', href: '/billing', icon: Crown },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, onToggle }) => {
  const isMobile = useIsMobile();

  const renderNavLink = (item: { name: string; href: string; icon: React.ElementType }, isExpanded: boolean, closeFn?: () => void) => (
    <NavLink
      key={item.name}
      to={item.href}
      onClick={closeFn}
      className={({ isActive }) => cn(
        "group flex items-center text-sm font-medium rounded-xl transition-all duration-200",
        isExpanded ? "px-3 py-2.5" : "px-2 py-2.5 justify-center",
        isActive
          ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 shadow-sm border border-emerald-100/50"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
      title={!isExpanded ? item.name : undefined}
    >
      <item.icon className={cn("flex-shrink-0 h-[18px] w-[18px]", isExpanded && "mr-3")} />
      {isExpanded && <span>{item.name}</span>}
    </NavLink>
  );

  const renderSectionLabel = (label: string, isExpanded: boolean) => {
    if (!isExpanded) return <div className="h-px bg-gray-200/60 mx-2 my-2" />;
    return (
      <div className="px-3 pt-4 pb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400/80">
          {label}
        </span>
      </div>
    );
  };

  // Mobile: Overlay sidebar
  if (isMobile) {
    return (
      <>
        {/* Overlay backdrop */}
        {open && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={onClose}
          />
        )}

        {/* Mobile sidebar drawer */}
        <div
          className={cn(
            "fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-md shadow-2xl z-50",
            "transition-transform duration-300 ease-out",
            "flex flex-col border-r border-gray-200/50",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header with logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="OkeBill" className="h-8 w-8" />
              <span className="text-lg font-semibold text-gray-900">Ok<span className="text-emerald-500">e</span>Bill</span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-2 overflow-y-auto">
            <nav className="px-3 space-y-0.5">
              {navSections.map((section, index) => (
                <React.Fragment key={section.label}>
                  {index > 0 && renderSectionLabel(section.label, true)}
                  {index === 0 && <div className="pb-1" />}
                  {section.items.map((item) => renderNavLink(item, true, onClose))}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span>Connected</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop/Tablet: Fixed sidebar with collapse
  return (
    <aside
      className={cn(
        "fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-md z-30",
        "transition-all duration-300 ease-out",
        "flex flex-col border-r border-gray-200/50 shadow-sm",
        open ? "w-64" : "w-16"
      )}
    >
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "absolute -right-3 top-6 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm",
          "hover:bg-gray-50 hover:border-gray-300 transition-colors z-10"
        )}
      >
        {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </Button>

      {/* Navigation */}
      <div className="flex-1 py-2 overflow-y-auto">
        <nav className={cn("space-y-0.5", open ? "px-3" : "px-2")}>
          {navSections.map((section, index) => (
            <React.Fragment key={section.label}>
              {index > 0 && renderSectionLabel(section.label, open)}
              {index === 0 && <div className="pb-1" />}
              {section.items.map((item) => renderNavLink(item, open))}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Footer - Version */}
      {open && (
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>v1.0.0</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
