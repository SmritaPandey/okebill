
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-9xl font-bold text-brand-blue-light">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mt-4 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          We couldn't find the page you're looking for. The page might have been moved, deleted,
          or might never have existed.
        </p>
        <Button className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark mx-auto" asChild>
          <a href="/">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
