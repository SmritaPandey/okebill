import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import AiChatbot from '@/components/ai/AiChatbot';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ShieldAlert, AlertTriangle, Crown, Trash2 } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Subscription States
  const [subStatus, setSubStatus] = React.useState<{ status: string; plan: string } | null>(null);
  const [isDowngrading, setIsDowngrading] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      const storedToken = localStorage.getItem('auth_token');
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/subscription/status`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.status) {
          setSubStatus({ status: data.status, plan: data.plan });
        }
      })
      .catch(err => console.error('Error fetching subscription status:', err));
    }
  }, [user]);

  const handleDowngradeToFree = async () => {
    if (confirm("Are you absolutely sure you want to downgrade to the Free Tier? This will permanently delete all your invoices, clients, proposals, contracts, payments, and expenses!")) {
      setIsDowngrading(true);
      try {
        const storedToken = localStorage.getItem('auth_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/subscription/downgrade-free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message || 'Successfully downgraded to Free Tier.');
          window.location.reload();
        } else {
          alert(data.message || 'Failed to downgrade');
        }
      } catch (err) {
        alert('An error occurred during downgrade.');
      } finally {
        setIsDowngrading(false);
      }
    }
  };

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

  const isExpired = subStatus?.status === 'expired' && 
                    location.pathname !== '/billing' && 
                    location.pathname !== '/payment/callback';

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

      {/* Trial Expired Blocker Overlay */}
      {isExpired && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6 border border-amber-100 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Your 14-Day Trial Has Expired
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Your trial period has ended. To continue using OkeBill with all features intact, please upgrade your subscription. 
              Alternatively, you can choose to downgrade to the Free Tier.
            </p>

            <div className="w-full bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 text-left mb-6">
              <div className="flex gap-2 text-amber-800 font-medium text-xs mb-1 items-center">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Important Data Policy</span>
              </div>
              <p className="text-xs text-amber-700 leading-normal">
                Downgrading to the Free Tier will permanently delete all trial transactional data, including invoices, payments, clients, expenses, and credit notes. This action is irreversible.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate('/billing')}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </button>
              
              <button
                onClick={handleDowngradeToFree}
                disabled={isDowngrading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDowngrading ? (
                  <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Trash2 className="w-4 h-4 text-slate-400" />
                )}
                Downgrade to Free Tier (Delete Data)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
