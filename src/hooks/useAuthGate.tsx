// src/hooks/useAuthGate.tsx - Complete replacement with action preservation
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

interface AuthGateOptions {
  featureName?: string;
  redirectTo?: string;
  backTo?: string;
}

interface PendingAction {
  type: 'mark-visited' | 'toggle-favorite' | 'add-to-collection';
  plaqueId: number;
  data?: any; // Additional action data (visit date, notes, etc.)
}

// Store pending action in session storage for persistence across auth flow
const PENDING_ACTION_KEY = 'plaquer_pending_action';

export const useAuthGate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Store a pending action
  const storePendingAction = useCallback((action: PendingAction) => {
    try {
      sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
      console.log('Stored pending action:', action);
    } catch (error) {
      console.warn('Could not store pending action:', error);
    }
  }, []);

  // Retrieve and clear pending action
  const retrievePendingAction = useCallback((): PendingAction | null => {
    try {
      const stored = sessionStorage.getItem(PENDING_ACTION_KEY);
      if (stored) {
        sessionStorage.removeItem(PENDING_ACTION_KEY);
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Could not retrieve pending action:', error);
    }
    return null;
  }, []);

  // Clear pending action (useful for cleanup)
  const clearPendingAction = useCallback(() => {
    try {
      sessionStorage.removeItem(PENDING_ACTION_KEY);
    } catch (error) {
      console.warn('Could not clear pending action:', error);
    }
  }, []);

  // Enhanced requireAuth with action preservation
  const requireAuth = useCallback((
    action: () => void,
    options: AuthGateOptions = {},
    pendingActionData?: PendingAction
  ) => {
    if (!user) {
      // Store the pending action if provided
      if (pendingActionData) {
        storePendingAction(pendingActionData);
      }

      // Navigate to auth gate
      navigate('/auth-required', {
        state: {
          featureName: options.featureName || 'this feature',
          redirectTo: options.redirectTo || location.pathname,
          backTo: options.backTo || '/discover'
        }
      });
      return;
    }

    // User is authenticated, execute the action immediately
    action();
  }, [user, navigate, location, storePendingAction]);

  // Specific auth-gated actions for common use cases
  const requireAuthForVisit = useCallback((
    plaqueId: number,
    visitAction: () => void,
    visitData?: { visitedAt?: string; notes?: string }
  ) => {
    requireAuth(
      visitAction,
      {
        featureName: 'track your visits',
        redirectTo: location.pathname
      },
      {
        type: 'mark-visited',
        plaqueId,
        data: visitData
      }
    );
  }, [requireAuth, location]);

  const requireAuthForFavorite = useCallback((
    plaqueId: number,
    favoriteAction: () => void
  ) => {
    requireAuth(
      favoriteAction,
      {
        featureName: 'save favorites',
        redirectTo: location.pathname
      },
      {
        type: 'toggle-favorite',
        plaqueId
      }
    );
  }, [requireAuth, location]);

  const requireAuthForCollection = useCallback((
    plaqueId: number,
    collectionAction: () => void
  ) => {
    requireAuth(
      collectionAction,
      {
        featureName: 'create and manage collections',
        redirectTo: location.pathname
      },
      {
        type: 'add-to-collection',
        plaqueId
      }
    );
  }, [requireAuth, location]);

  const isAuthenticated = !!user;

  return {
    requireAuth,
    requireAuthForVisit,
    requireAuthForFavorite,
    requireAuthForCollection,
    retrievePendingAction,
    clearPendingAction,
    isAuthenticated,
    user
  };
};