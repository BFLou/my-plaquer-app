// src/components/auth/RequireAuth.tsx - Enhanced with custom auth gate URLs
import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';

type RequireAuthProps = {
  children: ReactNode;
  /** Whether to show the full AuthGate page or just the modal */
  showGatePage?: boolean;
  /** Feature name to show in the gate */
  featureName?: string;
  /** Where to redirect after successful auth */
  redirectTo?: string;
  /** Custom auth gate URL to use */
  authGateUrl?: string;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  showGatePage = false,
  featureName,
  redirectTo,
  authGateUrl 
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
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

  // If not logged in, navigate to appropriate auth gate
  if (!user) {
    if (showGatePage) {
      // Determine auth gate URL based on path if not provided
      const targetAuthGate = authGateUrl || determineAuthGateUrl(location.pathname);
      
      // Use useEffect to avoid navigation during render
      React.useEffect(() => {
        navigate(targetAuthGate, {
          state: {
            featureName,
            redirectTo: redirectTo || location.pathname,
            backTo: getBackPath(location.pathname),
            preserveModal: true,
            preserveParams: true
          }
        });
      }, []);
      
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-2">
            <Loader className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-500">Redirecting to sign up...</p>
          </div>
        </div>
      );
    }
    
    // For other cases, you could show a modal or redirect to signin
    React.useEffect(() => {
      navigate('/signin', {
        state: {
          redirectTo: location.pathname,
          backTo: getBackPath(location.pathname)
        }
      });
    }, []);
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Helper function to determine appropriate auth gate URL based on path
const determineAuthGateUrl = (pathname: string): string => {
  if (pathname.includes('/collections')) return '/join/to-create-collections';
  if (pathname.includes('/routes')) return '/join/to-plan-routes';
  if (pathname.includes('/visits')) return '/join/to-track-visits';
  if (pathname.includes('/library')) return '/join/to-access-library';
  if (pathname.includes('/profile')) return '/join/to-manage-profile';
  if (pathname.includes('/settings')) return '/join/to-access-settings';
  return '/join';
};

// Helper function to determine where the back button should go
const getBackPath = (pathname: string): string => {
  if (pathname.includes('/collections')) return '/discover';
  if (pathname.includes('/routes')) return '/discover';
  if (pathname.includes('/library')) return '/discover';
  if (pathname.includes('/profile')) return '/';
  if (pathname.includes('/settings')) return '/profile';
  return '/discover';
};

export default RequireAuth;