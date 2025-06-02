// src/hooks/useAuthGate.tsx - Complete enhanced version with full context preservation
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

interface AuthGateOptions {
  featureName?: string;
  redirectTo?: string;
  backTo?: string;
  preserveModal?: boolean;
  preserveParams?: boolean;
}

interface PendingAction {
  type: 'mark-visited' | 'toggle-favorite' | 'add-to-collection';
  plaqueId: number;
  data?: any;
}

interface NavigationContext {
  originalPath: string;
  originalParams: URLSearchParams;
  modalState?: {
    plaqueId?: number;
    collectionId?: string;
    routeId?: string;
  };
  referrer?: string;
  timestamp: number;
}

// Enhanced storage keys
const PENDING_ACTION_KEY = 'plaquer_pending_action';
const NAVIGATION_CONTEXT_KEY = 'plaquer_navigation_context';

export const useAuthGate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Store navigation context for proper back navigation
  const storeNavigationContext = useCallback((options: AuthGateOptions = {}) => {
    const context: NavigationContext = {
      originalPath: location.pathname,
      originalParams: new URLSearchParams(location.search),
      referrer: document.referrer,
      timestamp: Date.now()
    };

    // Extract modal state from URL if present
    if (options.preserveModal) {
      const params = new URLSearchParams(location.search);
      context.modalState = {
        plaqueId: params.get('plaque') ? parseInt(params.get('plaque')!) : undefined,
        collectionId: params.get('collection') || undefined,
        routeId: params.get('route') || undefined,
      };
    }

    try {
      sessionStorage.setItem(NAVIGATION_CONTEXT_KEY, JSON.stringify(context));
      console.log('🔒 Stored navigation context:', context);
    } catch (error) {
      console.warn('Could not store navigation context:', error);
    }
  }, [location]);

  // Retrieve and restore navigation context
  const retrieveNavigationContext = useCallback((): NavigationContext | null => {
    try {
      const stored = sessionStorage.getItem(NAVIGATION_CONTEXT_KEY);
      if (stored) {
        const context = JSON.parse(stored);
        
        // Check if context is stale (older than 30 minutes)
        const isStale = Date.now() - context.timestamp > 30 * 60 * 1000;
        if (isStale) {
          sessionStorage.removeItem(NAVIGATION_CONTEXT_KEY);
          return null;
        }
        
        return context;
      }
    } catch (error) {
      console.warn('Could not retrieve navigation context:', error);
    }
    return null;
  }, []);

  // Store pending action
  const storePendingAction = useCallback((action: PendingAction) => {
    try {
      sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify({
        ...action,
        timestamp: Date.now()
      }));
      console.log('🔒 Stored pending action:', action);
    } catch (error) {
      console.warn('Could not store pending action:', error);
    }
  }, []);

  // Retrieve pending action
  const retrievePendingAction = useCallback((): PendingAction | null => {
    try {
      const stored = sessionStorage.getItem(PENDING_ACTION_KEY);
      if (stored) {
        sessionStorage.removeItem(PENDING_ACTION_KEY);
        const action = JSON.parse(stored);
        
        // Check if action is stale (older than 30 minutes)
        const isStale = Date.now() - action.timestamp > 30 * 60 * 1000;
        if (isStale) {
          return null;
        }
        
        return action;
      }
    } catch (error) {
      console.warn('Could not retrieve pending action:', error);
    }
    return null;
  }, []);

  // Clear stored data
  const clearStoredData = useCallback(() => {
    try {
      sessionStorage.removeItem(PENDING_ACTION_KEY);
      sessionStorage.removeItem(NAVIGATION_CONTEXT_KEY);
      console.log('🧹 Cleared auth gate storage');
    } catch (error) {
      console.warn('Could not clear stored data:', error);
    }
  }, []);

  // Enhanced requireAuth with better context handling
  const requireAuth = useCallback((
    action: () => void,
    options: AuthGateOptions = {},
    pendingActionData?: PendingAction
  ) => {
    if (!user) {
      // Store navigation context for proper back navigation
      storeNavigationContext(options);

      // Store pending action if provided
      if (pendingActionData) {
        storePendingAction(pendingActionData);
      }

      // Determine the appropriate auth gate URL based on context
      let authGateUrl = '/join';
      
      if (pendingActionData) {
        switch (pendingActionData.type) {
          case 'toggle-favorite':
            authGateUrl = '/join/to-save-favorites';
            break;
          case 'mark-visited':
            authGateUrl = '/join/to-track-visits';
            break;
          case 'add-to-collection':
            authGateUrl = '/join/to-create-collections';
            break;
        }
      } else if (location.pathname.includes('/library/collections')) {
        authGateUrl = '/join/to-create-collections';
      } else if (location.pathname.includes('/library/routes')) {
        authGateUrl = '/join/to-plan-routes';
      } else if (location.pathname.includes('/library/visits')) {
        authGateUrl = '/join/to-track-visits';
      } else if (location.pathname.includes('/library')) {
        authGateUrl = '/join/to-access-library';
      } else if (location.pathname.includes('/profile')) {
        authGateUrl = '/join/to-manage-profile';
      } else if (location.pathname.includes('/settings')) {
        authGateUrl = '/join/to-access-settings';
      }

      console.log('🚪 Navigating to auth gate:', authGateUrl);

      // Navigate to contextual auth gate with state
      navigate(authGateUrl, {
        state: {
          featureName: options.featureName,
          redirectTo: options.redirectTo || location.pathname,
          backTo: options.backTo || getSmartBackPath(),
          preserveModal: options.preserveModal,
          preserveParams: options.preserveParams
        }
      });
      return;
    }

    // User is authenticated, execute the action immediately
    action();
  }, [user, navigate, location, storeNavigationContext, storePendingAction]);

  // Smart back path determination
  const getSmartBackPath = useCallback(() => {
    const path = location.pathname;
    
    if (path.includes('/plaque/')) {
      // If we're on a plaque detail page, determine where we came from
      const params = new URLSearchParams(location.search);
      const from = params.get('from');
      
      if (from === 'collection' && params.get('collection')) {
        return `/library/collections/${params.get('collection')}`;
      } else if (from === 'route' && params.get('route')) {
        return `/library/routes/${params.get('route')}`;
      } else if (from === 'search') {
        const searchQuery = params.get('search');
        return searchQuery ? `/discover?search=${encodeURIComponent(searchQuery)}` : '/discover';
      } else {
        return '/discover';
      }
    } else if (path.includes('/library/collections')) {
      return '/library';
    } else if (path.includes('/library/routes')) {
      return '/library';
    } else if (path.includes('/library/visits')) {
      return '/library';
    } else if (path.includes('/library')) {
      return '/';
    } else if (path.includes('/profile')) {
      return '/';
    } else if (path.includes('/settings')) {
      return '/profile';
    } else {
      return '/discover';
    }
  }, [location]);

  // Enhanced restore navigation for post-auth flow
  const restoreNavigation = useCallback(() => {
    const context = retrieveNavigationContext();
    if (!context) return null;

    // Build the restoration URL
    let targetUrl = context.originalPath;
    const params = new URLSearchParams();

    // Restore original parameters
    context.originalParams.forEach((value, key) => {
      params.set(key, value);
    });

    // Restore modal state if it existed
    if (context.modalState) {
      if (context.modalState.plaqueId) {
        params.set('plaque', context.modalState.plaqueId.toString());
      }
      if (context.modalState.collectionId) {
        params.set('collection', context.modalState.collectionId);
      }
      if (context.modalState.routeId) {
        params.set('route', context.modalState.routeId);
      }
    }

    const queryString = params.toString();
    if (queryString) {
      targetUrl += `?${queryString}`;
    }

    console.log('🔄 Restoring navigation to:', targetUrl);
    return targetUrl;
  }, [retrieveNavigationContext]);

  // Specific auth-gated actions with enhanced context
  const requireAuthForVisit = useCallback((
    plaqueId: number,
    visitAction: () => void,
    visitData?: { visitedAt?: string; notes?: string }
  ) => {
    requireAuth(
      visitAction,
      {
        featureName: 'track your visits',
        redirectTo: location.pathname,
        preserveModal: true,
        preserveParams: true
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
        redirectTo: location.pathname,
        preserveModal: true,
        preserveParams: true
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
        redirectTo: location.pathname,
        preserveModal: true,
        preserveParams: true
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
    restoreNavigation,
    clearStoredData,
    isAuthenticated,
    user
  };
};