// components/OfflineIndicator.tsx
import React, { useEffect, useState } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!isOffline) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-800 px-3 py-2 rounded-lg shadow-md flex items-center z-50">
      <WifiOff size={16} className="mr-2" />
      <span>You're offline - changes will sync when you reconnect</span>
    </div>
  );
};

export default OfflineIndicator;