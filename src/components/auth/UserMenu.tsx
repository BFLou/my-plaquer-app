// src/components/auth/UserMenu.tsx - Enhanced with mobile-friendly auth flow
import React from 'react';
import {
  User,
  LogOut,
  Settings,
  LogIn,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileDialog } from '@/components/ui/mobile-dialog';
import { MobileButton } from '@/components/ui/mobile-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

const UserMenu: React.FC = () => {
  const { user, signOut, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileAuthDialog, setShowMobileAuthDialog] = React.useState(false);
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.displayName) return 'U';

    const names = user.displayName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      triggerHapticFeedback('medium');
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('There was a problem signing out');
    }
  };

  const handleQuickSignIn = async () => {
    setIsSigningIn(true);
    triggerHapticFeedback('medium');

    try {
      await signInWithGoogle();
      setShowMobileAuthDialog(false);
      toast.success('Welcome to Plaquer!');

      // Redirect to discover page after sign in
      setTimeout(() => {
        navigate('/discover');
      }, 100);
    } catch (error) {
      console.error('Quick sign in failed:', error);
      toast.error('Sign in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleFullSignIn = () => {
    triggerHapticFeedback('light');
    setShowMobileAuthDialog(false);

    // Navigate to sign in page with current location as redirect
    navigate('/signin', {
      state: {
        redirectTo: location.pathname,
        backTo: location.pathname,
      },
    });
  };

  const handleCreateAccount = () => {
    triggerHapticFeedback('light');
    setShowMobileAuthDialog(false);

    // Navigate to auth gate with current location as redirect
    navigate('/join', {
      state: {
        redirectTo: location.pathname,
        backTo: location.pathname,
      },
    });
  };

  const handleMobileAuthClick = () => {
    if (isMobile()) {
      triggerHapticFeedback('light');
      setShowMobileAuthDialog(true);
    } else {
      handleFullSignIn();
    }
  };

  return (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user.photoURL || undefined}
                  alt={user.displayName || 'User'}
                />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs leading-none text-gray-500">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Personal Content Group */}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Enhanced buttons for non-authenticated users
        <div className="flex items-center gap-2">
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={handleFullSignIn}
              className="text-gray-600 hover:text-blue-600 transition font-normal"
            >
              Sign In
            </button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateAccount}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <User size={14} />
              Join Free
            </Button>
          </div>

          {/* Mobile-optimized single button */}
          <div className="md:hidden">
            <Button
              variant="default"
              size="sm"
              onClick={handleMobileAuthClick}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-3 py-2"
            >
              <User size={14} />
              <span className="text-sm">Sign In</span>
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Auth Dialog */}
      <MobileDialog
        isOpen={showMobileAuthDialog}
        onClose={() => setShowMobileAuthDialog(false)}
        title="Welcome to Plaquer"
        size="md"
      >
        <div className="p-4">
          {/* Welcome message */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start your historic journey
            </h3>
            <p className="text-sm text-gray-600">
              Discover, track, and collect London's iconic blue plaques with a
              free account.
            </p>
          </div>

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
                  Continue with Google
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
                <UserPlus size={16} />
                Create Account
              </MobileButton>
            </div>
          </div>

          {/* Benefits preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              With your free account:
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                Save and organize your favorite plaques
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                Track your visits and build a collection
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                Plan custom walking routes
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                Access your data across all devices
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="text-center mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Free forever • Secure • No spam
            </p>
          </div>
        </div>
      </MobileDialog>
    </>
  );
};

export default UserMenu;
