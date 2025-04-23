
import React from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  React.useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
