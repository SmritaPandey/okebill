import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Decorative 404 */}
        <div className="relative mb-8">
          <h1 className="text-[160px] font-black text-slate-100 leading-none select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1E3A5F]/10 flex items-center justify-center">
              <Search className="w-10 h-10 text-[#1E3A5F]" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">Page Not Found</h2>
        <p className="text-slate-500 mb-2">
          The page <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono text-[#1E3A5F]">{location.pathname}</code> doesn't exist.
        </p>
        <p className="text-sm text-slate-400 mb-8">
          It may have been moved, deleted, or you may have mistyped the URL.
        </p>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="gap-2 rounded-xl bg-[#1E3A5F] hover:bg-[#16304d]"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>

        <p className="text-xs text-slate-300 mt-10">
          Need help? <a href="/contact" className="text-emerald-600 underline">Contact support</a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
