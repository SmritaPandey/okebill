import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import AiChatbot from '@/components/ai/AiChatbot';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Update sidebar state when screen size changes
  React.useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center mesh-gradient">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="OkeBill" className="h-10 w-10" />
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
          <span className="text-sm text-gray-500 font-medium">Loading OkeBill...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-gradient">
      {/* Top Navigation */}
      <TopNavbar onMenuToggle={handleSidebarToggle} />

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        onToggle={handleSidebarToggle}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          "min-h-[calc(100vh-4rem)] pt-16 transition-all duration-300 ease-out",
          // On mobile: no margin needed, sidebar is overlay
          // On desktop/tablet: adjust margin based on sidebar state
          isMobile
            ? "ml-0 px-4 pb-6"
            : sidebarOpen
              ? "ml-64 px-6 pb-6"
              : "ml-16 px-6 pb-6"
        )}
      >
        <div className="py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* AI Chatbot */}
      <AiChatbot />
    </div>
  );
};

export default MainLayout;
