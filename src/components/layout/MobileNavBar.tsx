// src/components/layout/MobileNavBar.tsx - Enhanced with better auth flow
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, User, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MobileDialog } from '@/components/ui/mobile-dialog';
import { MobileButton } from '@/components/ui/mobile-button';
import { toast } from 'sonner';
import { triggerHapticFeedback } from '@/utils/mobileUtils';

type NavItem = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  activePattern: RegExp;
  requiresAuth?: boolean;
  description?: string;
  authGateUrl?: string;
};

const navItems: NavItem[] = [
  {
    icon: Home,
    label: 'Home',
    path: '/',
    activePattern: /^\/$/,
  },
  {
    icon: Search,
    label: 'Discover',
    path: '/discover',
    activePattern: /^\/discover/,
  },
  {
    icon: BookOpen,
    label: 'Library',
    path: '/library',
    activePattern: /^\/library/,
    requiresAuth: true,
    description: 'Access your collections, routes, and visits',
    authGateUrl: '/join/to-access-library',
  },
  {
    icon: User,
    label: 'Profile',
    path: '/profile',
    activePattern: /^\/profile|\/settings/,
    requiresAuth: true,
    description: 'Manage your account and view your progress',
    authGateUrl: '/join/to-manage-profile',
  },
];

export const MobileNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithGoogle } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = React.useState(false);
  const [selectedAuthItem, setSelectedAuthItem] =
    React.useState<NavItem | null>(null);
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleNavigation = (item: NavItem) => {
    triggerHapticFeedback('light');

    if (item.requiresAuth && !user) {
      // Show auth prompt instead of navigating directly
      setSelectedAuthItem(item);
      setShowAuthPrompt(true);
      return;
    }

    navigate(item.path);
  };

  const handleQuickSignIn = async () => {
    if (!selectedAuthItem) return;

    setIsSigningIn(true);
    triggerHapticFeedback('medium');

    try {
      await signInWithGoogle();
      setShowAuthPrompt(false);

      // Navigate to the desired destination after successful sign in
      setTimeout(() => {
        navigate(selectedAuthItem.path);
        toast.success(
          `Welcome! Accessing your ${selectedAuthItem.label.toLowerCase()}`
        );
      }, 100);
    } catch (error) {
      console.error('Quick sign in failed:', error);
      toast.error('Sign in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleFullSignIn = () => {
    if (!selectedAuthItem) return;

    triggerHapticFeedback('light');
    setShowAuthPrompt(false);

    // Navigate to sign in page with context
    navigate('/signin', {
      state: {
        featureName: `access ${selectedAuthItem.label.toLowerCase()}`,
        redirectTo: selectedAuthItem.path,
        backTo: location.pathname,
      },
    });
  };

  const handleCreateAccount = () => {
    if (!selectedAuthItem) return;

    triggerHapticFeedback('light');
    setShowAuthPrompt(false);

    // Navigate to appropriate auth gate
    const authGateUrl = selectedAuthItem.authGateUrl || '/join';
    navigate(authGateUrl, {
      state: {
        featureName: `access ${selectedAuthItem.label.toLowerCase()}`,
        redirectTo: selectedAuthItem.path,
        backTo: location.pathname,
      },
    });
  };

  const isActive = (item: NavItem) => {
    return item.activePattern.test(location.pathname);
  };

  const getButtonStyle = (item: NavItem, active: boolean) => {
    const needsAuth = item.requiresAuth && !user;

    if (active) {
      return 'text-blue-600 bg-blue-50';
    }

    if (needsAuth) {
      return 'text-gray-400 bg-gray-50/50';
    }

    return 'text-gray-600 hover:text-blue-600 hover:bg-gray-50';
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-pb md:hidden">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            const needsAuth = item.requiresAuth && !user;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] relative ${getButtonStyle(item, active)}`}
                disabled={false} // Never disable - we handle auth in the click handler
              >
                {/* Icon with lock overlay for auth-required items */}
                <div className="relative mb-1">
                  <Icon
                    size={20}
                    className={`transition-transform duration-200 ${
                      active ? 'scale-110' : ''
                    }`}
                  />

                  {/* Single lock overlay for unauthenticated users */}
                  {needsAuth && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                      <Lock size={8} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-medium ${
                    active ? 'font-semibold' : ''
                  }`}
                >
                  {item.label}
                </span>

                {/* Active indicator */}
                {active && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Enhanced Auth Prompt Dialog */}
      <MobileDialog
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title={`Sign in to access ${selectedAuthItem?.label}`}
        size="md"
      >
        <div className="p-4">
          {/* Feature description */}
          {selectedAuthItem && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <selectedAuthItem.icon className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">
                    {selectedAuthItem.label}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {selectedAuthItem.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Google Sign In */}
          <div className="space-y-3 mb-6">
            <MobileButton
              onClick={handleQuickSignIn}
              disabled={isSigningIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 h-auto flex items-center justify-center gap-2"
              touchOptimized
            >
              {isSigningIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Quick Sign In with Google
                </>
              )}
            </MobileButton>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            {/* Alternative options */}
            <div className="grid grid-cols-2 gap-3">
              <MobileButton
                onClick={handleFullSignIn}
                variant="outline"
                className="py-3 h-auto flex items-center justify-center gap-2"
                touchOptimized
              >
                <LogIn size={16} />
                Sign In
              </MobileButton>

              <MobileButton
                onClick={handleCreateAccount}
                variant="outline"
                className="py-3 h-auto flex items-center justify-center gap-2"
                touchOptimized
              >
                <User size={16} />
                Create Account
              </MobileButton>
            </div>
          </div>

          {/* Benefits preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">What you'll get:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                Save your favorite plaques
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                Track your visits and progress
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                Create custom collections and routes
              </div>
            </div>
          </div>
        </div>
      </MobileDialog>
    </>
  );
};
