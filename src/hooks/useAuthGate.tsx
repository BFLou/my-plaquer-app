// src/hooks/useAuthGate.ts
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthGateOptions {
  featureName?: string;
  redirectTo?: string;
  backTo?: string;
}

export const useAuthGate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = (
    action: () => void,
    options: AuthGateOptions = {}
  ) => {
    if (!user) {
      // Show the auth gate
      navigate('/auth-required', {
        state: {
          featureName: options.featureName || 'this feature',
          redirectTo: options.redirectTo || location.pathname,
          backTo: options.backTo || '/discover'
        }
      });
      return;
    }

    // User is authenticated, execute the action
    action();
  };

  const isAuthenticated = !!user;

  return {
    requireAuth,
    isAuthenticated,
    user
  };
};