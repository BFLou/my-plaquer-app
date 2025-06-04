// src/pages/SignInPage.tsx - Enhanced with working back button
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, CheckCircle, Star, Plus, Route as RouteIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { useAuthGate } from '@/hooks/useAuthGate';
import AccountLinkingModal from '@/components/auth/AccountLinkingModal';
import AuthErrorDisplay from '@/components/auth/AuthErrorDisplay';
import { toast } from 'sonner';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();
  const { restoreNavigation, clearStoredData } = useAuthGate();
  
  // Get state from navigation with fallbacks
  const navigationState = location.state as any;
  const pendingAction = navigationState?.pendingAction;
  const featureName = navigationState?.featureName;
  const redirectTo = navigationState?.redirectTo || '/discover';
  const backTo = navigationState?.backTo || '/discover';
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<any>(null);

  // Account linking modal state
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [linkingData, setLinkingData] = useState<{
    email: string;
    existingMethods: string[];
    suggestedAction: 'google' | 'signin' | 'signin-then-link';
  } | null>(null);

  // Clean up stored data when component unmounts without successful auth
  useEffect(() => {
    return () => {
      // Only clear if we're navigating away without success
      // Success cases are handled by PendingActionHandler
    };
  }, []);

  // Enhanced back button handler with multiple fallback strategies
  const handleBack = () => {
    console.log('🔙 Back button clicked');
    console.log('Navigation state:', navigationState);
    console.log('Current location:', location);
    
    try {
      // Strategy 1: Try to restore navigation context from auth gate
      const restoredUrl = restoreNavigation();
      if (restoredUrl && restoredUrl !== window.location.pathname) {
        console.log('🔄 Restoring navigation to:', restoredUrl);
        navigate(restoredUrl);
        return;
      }
      
      // Strategy 2: Use backTo from navigation state
      if (backTo && backTo !== window.location.pathname) {
        console.log('🎯 Using backTo:', backTo);
        navigate(backTo);
        return;
      }
      
      // Strategy 3: Check if we can go back in browser history
      if (window.history.length > 1) {
        console.log('📚 Using browser history back');
        navigate(-1);
        return;
      }
      
      // Strategy 4: Fallback to discover page
      console.log('🏠 Fallback to discover');
      navigate('/discover');
      
    } catch (error) {
      console.error('Error in back navigation:', error);
      // Final fallback
      navigate('/discover');
    } finally {
      // Clear stored data when going back without authenticating
      clearStoredData();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error when user starts typing
    if (authError) setAuthError(null);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Validation
    if (!formData.email.trim()) {
      setAuthError({ code: 'validation/email-required', message: 'Please enter your email address' });
      return;
    }
    if (!formData.password.trim()) {
      setAuthError({ code: 'validation/password-required', message: 'Please enter your password' });
      return;
    }

    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password);
      toast.success('Welcome back!');
      
      // Try to restore navigation context, otherwise use redirect
      const restoredUrl = restoreNavigation();
      navigate(restoredUrl || redirectTo);
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Handle account linking scenarios
      if (err.canSignIn || err.existingMethods) {
        setLinkingData({
          email: formData.email,
          existingMethods: err.existingMethods || [],
          suggestedAction: err.suggestedAction || 'signin'
        });
        setShowLinkingModal(true);
        setAuthError(null); // Clear error since we're showing the modal
      } else {
        setAuthError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsLoading(true);

    try {
      await signInWithGoogle();
      toast.success('Welcome back!');
      
      // Try to restore navigation context, otherwise use redirect
      const restoredUrl = restoreNavigation();
      navigate(restoredUrl || redirectTo);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      
      // Handle account linking scenarios
      if (err.canLink || err.existingMethods) {
        setLinkingData({
          email: err.email || '',
          existingMethods: err.existingMethods || [],
          suggestedAction: err.suggestedAction || 'signin-then-link'
        });
        setShowLinkingModal(true);
        setAuthError(null);
      } else {
        setAuthError(err);
      }
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate('/join', {
      state: {
        redirectTo,
        backTo,
        featureName
      }
    });
  };

  const handleLinkingClose = () => {
    setShowLinkingModal(false);
    setLinkingData(null);
  };

  const handleLinkingSuccess = () => {
    setShowLinkingModal(false);
    setLinkingData(null);
    toast.success('Welcome back!');
    
    // Try to restore navigation context, otherwise use redirect
    const restoredUrl = restoreNavigation();
    navigate(restoredUrl || redirectTo);
  };

  // Helper function to handle password reset
  const handlePasswordReset = (email: string) => {
    navigate('/forgot-password', { state: { email, redirectTo, backTo } });
  };

  // Get action-specific messaging
  const getActionMessage = () => {
    if (!pendingAction) return null;

    const actionIcons = {
      'mark-visited': <CheckCircle className="w-4 h-4 text-green-600" />,
      'toggle-favorite': <Star className="w-4 h-4 text-amber-600" />,
      'add-to-collection': <Plus className="w-4 h-4 text-purple-600" />,
      'save-route': <RouteIcon className="w-4 h-4 text-blue-600" />
    };

    const actionMessages = {
      'mark-visited': 'mark this plaque as visited',
      'toggle-favorite': 'add this plaque to your favorites',
      'add-to-collection': 'add this plaque to a collection',
      'save-route': 'save your walking route'
    };

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          {actionIcons[pendingAction.type]}
          <div>
            <h3 className="font-medium text-blue-900 mb-1">
              Sign in to {actionMessages[pendingAction.type]}
            </h3>
            <p className="text-sm text-blue-700">
              {pendingAction.type === 'save-route' 
                ? "We'll save your route once you're signed in."
                : "We'll complete this action once you're signed in."
              }
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Get dynamic back button text based on context
  const getBackButtonText = () => {
    if (pendingAction) return 'Back to browsing';
    if (featureName) return 'Back';
    return 'Back';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-6 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white"></div>
          <div className="absolute top-32 right-32 w-16 h-16 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Enhanced back button - always show */}
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 transition-colors"
              disabled={isLoading}
              title="Go back to previous page"
            >
              <ArrowLeft size={18} />
            </Button>
            <span className="text-white/80 text-sm">
              {getBackButtonText()}
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="opacity-90 mt-1">
              {featureName 
                ? `Sign in to ${featureName} and continue exploring London's historic plaques`
                : "Sign in to access your saved plaques, collections, and routes"
              }
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-md px-4 py-8">
        {/* Pending action message */}
        {getActionMessage()}

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In to Your Account</h2>
            <p className="text-gray-600 text-sm">
              Welcome back! Enter your details below.
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button 
            type="button" 
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 mb-6 py-3 h-auto"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-500">or sign in with email</span>
            </div>
          </div>

          {/* Email Sign In Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative mt-1">
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="you@example.com"
                  disabled={isLoading}
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Input 
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="text-right">
              <button 
                type="button"
                onClick={() => handlePasswordReset(formData.email)}
                className="text-sm text-blue-600 hover:underline"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>

            {/* Enhanced Error Display */}
            <AuthErrorDisplay
              error={authError}
              email={formData.email}
              context="signin"
              onRetry={() => setAuthError(null)}
              onResetPassword={handlePasswordReset}
              onSwitchToSignUp={handleCreateAccount}
            />

            <Button 
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium h-auto"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button 
                onClick={handleCreateAccount}
                className="text-blue-600 hover:underline font-medium"
                disabled={isLoading}
              >
                Create one now
              </button>
            </p>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle className="text-green-500" size={12} />
                <span>Secure Login</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="text-green-500" size={12} />
                <span>Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Linking Modal */}
      {showLinkingModal && linkingData && (
        <AccountLinkingModal
          isOpen={showLinkingModal}
          onClose={handleLinkingClose}
          email={linkingData.email}
          existingMethods={linkingData.existingMethods}
          suggestedAction={linkingData.suggestedAction}
          onSuccess={handleLinkingSuccess}
        />
      )}
    </div>
  );
};

export default SignInPage;