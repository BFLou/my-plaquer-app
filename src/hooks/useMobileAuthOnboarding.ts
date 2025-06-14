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

  // Show welcome toast on home page
  const showWelcomeToast = useCallback(() => {
    if (!shouldShowOnboarding() || onboardingState.hasShownWelcome) return;

    const toastId = toast.info(
      "👋 Welcome to Plaquer! Discover London's historic blue plaques and create your personal collection.",
      {
        duration: 6000,
        position: 'top-center',
        className: 'mobile-onboarding-toast welcome-toast',
        action: {
          label: 'Get Started',
          onClick: () => {
            triggerHapticFeedback('light');
            navigate('/join');
            toast.dismiss(toastId);
          },
        },
        onDismiss: () => {
          saveOnboardingState({
            hasShownWelcome: true,
            dismissedCount: onboardingState.dismissedCount + 1,
            lastShown: new Date().toISOString(),
          });
        },
      }
    );

    saveOnboardingState({ hasShownWelcome: true });
  }, [shouldShowOnboarding, onboardingState, navigate, saveOnboardingState]);

  // Show navigation hint
  const showNavigationHint = useCallback(() => {
    if (!shouldShowOnboarding() || onboardingState.hasShownNavHint) return;

    const toastId = toast.info(
      '💡 Tap the Profile or Library tabs below to sign in and unlock all features!',
      {
        duration: 8000,
        position: 'bottom-center',
        className: 'mobile-onboarding-toast nav-hint-toast',
        style: {
          marginBottom: '80px', // Above the navigation bar
        },
        action: {
          label: 'Sign In',
          onClick: () => {
            triggerHapticFeedback('medium');
            navigate('/signin');
            toast.dismiss(toastId);
          },
        },
        onDismiss: () => {
          saveOnboardingState({
            hasShownNavHint: true,
            dismissedCount: onboardingState.dismissedCount + 1,
            lastShown: new Date().toISOString(),
          });
        },
      }
    );

    saveOnboardingState({ hasShownNavHint: true });
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

  // Show discovery hint on discover page
  const showDiscoveryHint = useCallback(() => {
    if (!shouldShowOnboarding()) return;

    // Only show after user has been on discover page for a few seconds
    const timer = setTimeout(() => {
      const toastId = toast.info(
        '🌟 Sign in to save your favorite plaques and track your visits!',
        {
          duration: 5000,
          position: 'top-center',
          className: 'mobile-onboarding-toast discovery-hint-toast',
          action: {
            label: 'Sign In',
            onClick: () => {
              triggerHapticFeedback('light');
              navigate('/signin', {
                state: {
                  featureName: 'save favorites and track visits',
                  redirectTo: '/discover',
                },
              });
              toast.dismiss(toastId);
            },
          },
        }
      );
    }, 5000);

    return () => clearTimeout(timer);
  }, [shouldShowOnboarding, navigate]);

  // Main effect to trigger onboarding based on route
  useEffect(() => {
    if (!isMobile() || user) return;

    const path = location.pathname;

    // Show different onboarding based on current page
    switch (path) {
      case '/':
        if (!onboardingState.hasShownWelcome) {
          setTimeout(showWelcomeToast, 2000);
        } else if (!onboardingState.hasShownNavHint) {
          setTimeout(showNavigationHint, 3000);
        }
        break;

      case '/discover':
        if (
          onboardingState.hasShownWelcome &&
          !onboardingState.hasShownNavHint
        ) {
          setTimeout(showNavigationHint, 4000);
        } else {
          // Show discovery-specific hint
          return showDiscoveryHint();
        }
        break;

      default:
        // Don't show onboarding on other pages
        break;
    }
  }, [
    user,
    location.pathname,
    onboardingState,
    showWelcomeToast,
    showNavigationHint,
    showDiscoveryHint,
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
