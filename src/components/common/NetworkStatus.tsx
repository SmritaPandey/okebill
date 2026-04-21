import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setShowBanner(true);
      // Auto-hide reconnected banner after 4 seconds
      setTimeout(() => setShowBanner(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
        isOnline && justReconnected
          ? 'bg-emerald-600 text-white'
          : 'bg-red-600 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>You're back online! All changes will sync automatically.</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>No internet connection. Some features may be unavailable.</span>
        </>
      )}
      {isOnline && (
        <button onClick={() => setShowBanner(false)} className="ml-2 p-0.5 rounded hover:bg-white/20">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default NetworkStatus;
