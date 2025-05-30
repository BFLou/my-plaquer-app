// src/components/auth/RequireAuth.tsx - Updated version
import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';
import AuthGate from './AuthGate';
import { useLocation } from 'react-router-dom';

type RequireAuthProps = {
  children: ReactNode;
  /** Whether to show the full AuthGate page or just the modal */
  showGatePage?: boolean;
  /** Feature name to show in the gate */
  featureName?: string;
  /** Where to redirect after successful auth */
  redirectTo?: string;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  showGatePage = false,
  featureName,
  redirectTo 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show auth gate or modal based on context
  if (!user) {
    // Show full gate page for certain routes that need accounts
    if (showGatePage || shouldShowGatePage(location.pathname)) {
      return (
        <AuthGate 
          featureName={featureName}
          redirectTo={redirectTo || location.pathname}
          backTo={getBackPath(location.pathname)}
        />
      );
    }
    
    // For other cases, show the preview with modal (your existing behavior)
    return (
      <>
        {React.cloneElement(children as React.ReactElement, { isPreview: true })}
        {/* Your existing AuthModal component would go here */}
      </>
    );
  }

  return <>{children}</>;
};

// Helper function to determine if we should show the gate page
const shouldShowGatePage = (pathname: string): boolean => {
  const gatePaths = [
    '/library',
    '/library/collections',
    '/library/routes', 
    '/library/visits',
    '/collections',
    '/routes',
    '/profile',
    '/settings'
  ];
  
  return gatePaths.some(path => pathname.startsWith(path));
};

// Helper function to determine where the back button should go
const getBackPath = (pathname: string): string => {
  if (pathname.includes('/collections')) return '/discover';
  if (pathname.includes('/routes')) return '/discover';
  if (pathname.includes('/library')) return '/discover';
  if (pathname.includes('/profile')) return '/';
  return '/discover';
};

export default RequireAuth;