// src/hooks/useMobileAuthOnboarding.ts - Complete mobile auth onboarding hook
import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

interface OnboardingState {
  hasShownWelcome: boolean;
  hasShownNavHint: boolean;
  hasShownFeatureHint: boolean;
  dismissedCount: number;
  lastShown: string | null;
}

const STORAGE_KEY = 'plaquer_mobile_onboarding';
const MAX_DISMISSALS = 3;
const COOLDOWN_HOURS = 24;

export const useMobileAuthOnboarding = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasShownWelcome: false,
    hasShownNavHint: false,
    hasShownFeatureHint: false,
    dismissedCount: 0,
    lastShown: null,
  });

  // Load onboarding state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOnboardingState(parsed);
      } catch (error) {
        console.warn('Failed to parse onboarding state:', error);
      }
    }
  }, []);

  // Save onboarding state to localStorage
  const saveOnboardingState = useCallback(
    (newState: Partial<OnboardingState>) => {
      const updatedState = { ...onboardingState, ...newState };
      setOnboardingState(updatedState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
    },
    [onboardingState]
  );

  // Check if we should show onboarding (cooldown logic)
  const shouldShowOnboarding = useCallback(() => {
    if (user || !isMobile()) return false;

    if (onboardingState.dismissedCount >= MAX_DISMISSALS) return false;

    if (onboardingState.lastShown) {
      const lastShownTime = new Date(onboardingState.lastShown).getTime();
      const now = Date.now();
      const hoursSinceLastShown = (now - lastShownTime) / (1000 * 60 * 60);

      if (hoursSinceLastShown < COOLDOWN_HOURS) return false;
    }

    return true;
  }, [user, onboardingState]);


  // Show a single, consolidated welcome toast
  const showWelcomeToast = useCallback(() => {
    if (!shouldShowOnboarding() || onboardingState.hasShownWelcome) return;

    const toastId = toast.info(
      "Welcome to Plaquer! Tap the Profile or Library tabs to unlock all features.",
      {
        duration: 8000,
        position: 'top-center',
        className: 'mobile-onboarding-toast welcome-toast',
        action: {
          label: 'Sign In / Join',
          onClick: () => {
            triggerHapticFeedback('light');
            navigate('/join');
            toast.dismiss(toastId);
          }
        },
        onDismiss: () => {
          saveOnboardingState({
            hasShownWelcome: true,
            // We can also decide not to count this as a dismissal if it's the primary welcome
            lastShown: new Date().toISOString()
          });
        }
      }
    );

    saveOnboardingState({ hasShownWelcome: true, hasShownNavHint: true }); // Also set hasShownNavHint to true
  }, [shouldShowOnboarding, onboardingState, navigate, saveOnboardingState]);

  // Show feature-specific hint when user tries to access locked features
  const showFeatureHint = useCallback(
    (featureName: string) => {
      if (!shouldShowOnboarding() || onboardingState.hasShownFeatureHint)
        return;

      const toastId = toast.info(
        `🔐 Sign in to ${featureName} and unlock your personal plaque collection!`,
        {
          duration: 6000,
          position: 'top-center',
          className: 'mobile-onboarding-toast feature-hint-toast',
          action: {
            label: 'Quick Sign In',
            onClick: () => {
              triggerHapticFeedback('medium');
              navigate('/signin', {
                state: {
                  featureName: `access ${featureName}`,
                  redirectTo: location.pathname,
                },
              });
              toast.dismiss(toastId);
            },
          },
          onDismiss: () => {
            saveOnboardingState({
              hasShownFeatureHint: true,
              dismissedCount: onboardingState.dismissedCount + 1,
              lastShown: new Date().toISOString(),
            });
          },
        }
      );

      saveOnboardingState({ hasShownFeatureHint: true });
    },
    [
      shouldShowOnboarding,
      onboardingState,
      navigate,
      location,
      saveOnboardingState,
    ]
  );

  
  // Main effect to trigger onboarding based on route
 useEffect(() => {
    if (!isMobile() || user) return;

    const path = location.pathname;

    // Only show the consolidated welcome toast on the home page
    if (path === '/') {
      if (!onboardingState.hasShownWelcome) {
        setTimeout(showWelcomeToast, 2000);
      }
    }
  }, [
    user,
    location.pathname,
    onboardingState,
    showWelcomeToast
  ]);

  // Clear onboarding when user signs in
  useEffect(() => {
    if (user) {
      localStorage.removeItem(STORAGE_KEY);
      // Show success message
      toast.success(
        '🎉 Welcome to Plaquer! You now have access to all features.',
        {
          duration: 4000,
          position: 'top-center',
          className: 'mobile-onboarding-toast success-toast',
        }
      );
    }
  }, [user]);

  // Return function to manually trigger feature hints
  return {
    showFeatureHint,
    resetOnboarding: () => {
      localStorage.removeItem(STORAGE_KEY);
      setOnboardingState({
        hasShownWelcome: false,
        hasShownNavHint: false,
        hasShownFeatureHint: false,
        dismissedCount: 0,
        lastShown: null,
      });
    },
  };
};

// Higher-order component for pages that need auth hints
export const withAuthOnboarding = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureName: string
): React.ComponentType<P> => {
  const AuthOnboardingWrapper: React.FC<P> = (props: P) => {
    const { showFeatureHint } = useMobileAuthOnboarding();
    const { user } = useAuth();

    useEffect(() => {
      if (!user && isMobile()) {
        // Show feature hint after a delay
        const timer = setTimeout(() => {
          showFeatureHint(featureName);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }, [user, showFeatureHint]);

    return React.createElement(WrappedComponent, props);
  };

  // Set display name for debugging
  AuthOnboardingWrapper.displayName = `withAuthOnboarding(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthOnboardingWrapper;
};

// Component version for easy integration
export const MobileAuthOnboarding: React.FC = () => {
  useMobileAuthOnboarding();
  return null;
};

// Hook for triggering specific onboarding messages
export const useOnboardingTrigger = () => {
  const { showFeatureHint } = useMobileAuthOnboarding();
  const { user } = useAuth();

  const triggerAuthHint = useCallback(
    (featureName: string) => {
      if (!user && isMobile()) {
        triggerHapticFeedback('light');
        showFeatureHint(featureName);
      }
    },
    [user, showFeatureHint]
  );

  return { triggerAuthHint };
};
