// src/components/auth/AuthGate.tsx - Enhanced with context support and navigation restoration
import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, FolderOpen, Route, Star, Check, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { useAuthGate } from '@/hooks/useAuthGate';
import { toast } from 'sonner';
import AccountLinkingModal from './AccountLinkingModal';
import AuthErrorDisplay from './AuthErrorDisplay';

interface AuthGateProps {
  /** What feature the user was trying to access */
  featureName?: string;
  /** Where to redirect after successful auth */
  redirectTo?: string;
  /** Where the back button should go */
  backTo?: string;
  /** Context for the auth gate (affects messaging and flow) */
  context?: 'favorites' | 'visits' | 'collections' | 'library' | 'routes' | 'profile' | 'settings' | 'general';
}

const AuthGate: React.FC<AuthGateProps> = ({ 
  featureName = "advanced features",
  redirectTo = "/library", 
  backTo = "/discover",
  context = "general"
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, signInWithGoogle } = useAuth();
  const { restoreNavigation, clearStoredData } = useAuthGate();
  
  // Get state from navigation (if passed via navigate state)
  const navigationState = location.state as any;
  const finalFeatureName = navigationState?.featureName || featureName;
  const finalRedirectTo = navigationState?.redirectTo || redirectTo;
  const finalBackTo = navigationState?.backTo || backTo;
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<any>(null);

  // Account linking modal state
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [linkingData, setLinkingData] = useState<{
    email: string;
    existingMethods: string[];
    suggestedAction: 'google' | 'signin' | 'signin-then-link';
  } | null>(null);

  // Clean up stored data when component unmounts
  useEffect(() => {
    return () => {
      // Don't clear if user successfully authenticated (will be handled by PendingActionHandler)
      // Only clear if user navigates away without authenticating
    };
  }, []);

  const handleBack = () => {
    // Try to restore navigation context first
    const restoredUrl = restoreNavigation();
    if (restoredUrl) {
      navigate(restoredUrl);
    } else {
      navigate(finalBackTo);
    }
    
    // Clear stored data when going back without authenticating
    clearStoredData();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error when user starts typing
    if (authError) setAuthError(null);
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Validation
    if (!formData.displayName.trim()) {
      setAuthError({ code: 'validation/display-name-required', message: 'Please enter your full name' });
      return;
    }
    if (!formData.email.trim()) {
      setAuthError({ code: 'validation/email-required', message: 'Please enter your email address' });
      return;
    }
    if (!formData.password.trim()) {
      setAuthError({ code: 'validation/password-required', message: 'Please enter a password' });
      return;
    }
    if (formData.password.length < 8) {
      setAuthError({ code: 'validation/password-too-short', message: 'Password must be at least 8 characters long' });
      return;
    }
    if (!agreeToTerms) {
      setAuthError({ code: 'validation/terms-required', message: 'Please agree to the Terms of Service and Privacy Policy' });
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.displayName);
      toast.success('Account created successfully! Welcome to Plaquer.');
      
      // Try to restore navigation context, otherwise use redirect
      const restoredUrl = restoreNavigation();
      navigate(restoredUrl || finalRedirectTo);
    } catch (err: any) {
      console.error('Registration error:', err);
      
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

  const handleGoogleRegister = async () => {
    setAuthError(null);
    setIsLoading(true);

    try {
      await signInWithGoogle();
      toast.success('Account created successfully! Welcome to Plaquer.');
      
      // Try to restore navigation context, otherwise use redirect
      const restoredUrl = restoreNavigation();
      navigate(restoredUrl || finalRedirectTo);
    } catch (err: any) {
      console.error('Google registration error:', err);
      
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

  const handleSignIn = () => {
    navigate('/signin', {
      state: {
        redirectTo: finalRedirectTo,
        backTo: finalBackTo
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
    toast.success('Welcome to Plaquer!');
    
    // Try to restore navigation context, otherwise use redirect
    const restoredUrl = restoreNavigation();
    navigate(restoredUrl || finalRedirectTo);
  };
  
  // Get context-specific features and messaging
  const getContextFeatures = () => {
    switch (context) {
      case 'favorites':
        return [
          {
            icon: <Star className="text-amber-600" size={18} />,
            title: "Save favorites",
            description: "Keep track of your most interesting finds"
          },
          {
            icon: <Check className="text-green-600" size={18} />,
            title: "Quick access",
            description: "Access your favorites from any device"
          },
          {
            icon: <Eye className="text-blue-600" size={18} />,
            title: "Track discoveries",
            description: "See which plaques you've bookmarked"
          }
        ];
      
      case 'visits':
        return [
          {
            icon: <Check className="text-green-600" size={18} />,
            title: "Track your visits",
            description: "Remember every plaque you've discovered"
          },
          {
            icon: <MapPin className="text-blue-600" size={18} />,
            title: "Location history",
            description: "See where you've been on the map"
          },
          {
            icon: <Star className="text-amber-600" size={18} />,
            title: "Add notes",
            description: "Record memories from your visits"
          }
        ];
      
      case 'collections':
        return [
          {
            icon: <FolderOpen className="text-purple-600" size={18} />,
            title: "Create collections",
            description: "Organize plaques by theme or location"
          },
          {
            icon: <Star className="text-amber-600" size={18} />,
            title: "Curate themes",
            description: "Group plaques by interests or areas"
          },
          {
            icon: <Eye className="text-blue-600" size={18} />,
            title: "Share discoveries",
            description: "Show friends your themed collections"
          }
        ];
      
      case 'routes':
        return [
          {
            icon: <Route className="text-green-600" size={18} />,
            title: "Plan walking routes",
            description: "Connect multiple plaques in custom routes"
          },
          {
            icon: <MapPin className="text-blue-600" size={18} />,
            title: "Navigate easily",
            description: "Get directions between plaque locations"
          },
          {
            icon: <Star className="text-amber-600" size={18} />,
            title: "Save for later",
            description: "Access your routes anytime"
          }
        ];
      
      case 'library':
        return [
          {
            icon: <FolderOpen className="text-purple-600" size={18} />,
            title: "Personal library",
            description: "All your collections in one place"
          },
          {
            icon: <Check className="text-green-600" size={18} />,
            title: "Visit tracking",
            description: "See your exploration progress"
          },
          {
            icon: <Route className="text-green-600" size={18} />,
            title: "Route planning",
            description: "Create and manage walking routes"
          }
        ];
      
      default:
        return [
          {
            icon: <Star className="text-amber-600" size={18} />,
            title: "Save favorites",
            description: "Keep track of your most interesting finds"
          },
          {
            icon: <MapPin className="text-blue-600" size={18} />,
            title: "Track your visits",
            description: "Remember every plaque you've discovered"
          },
          {
            icon: <FolderOpen className="text-purple-600" size={18} />,
            title: "Create collections",
            description: "Organize plaques by theme or location"
          },
          {
            icon: <Route className="text-green-600" size={18} />,
            title: "Plan walking routes",
            description: "Connect multiple plaques in custom routes"
          }
        ];
    }
  };

  const features = getContextFeatures();

  const getContextTitle = () => {
    switch (context) {
      case 'favorites':
        return 'Start Saving Favorites';
      case 'visits':
        return 'Start Tracking Visits';
      case 'collections':
        return 'Start Creating Collections';
      case 'routes':
        return 'Start Planning Routes';
      case 'library':
        return 'Access Your Library';
      case 'profile':
        return 'Manage Your Profile';
      case 'settings':
        return 'Access Settings';
      default:
        return 'Unlock More Features';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with theme circles */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-6 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white"></div>
          <div className="absolute top-32 right-32 w-16 h-16 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              disabled={isLoading}
            >
              <ArrowLeft size={18} />
            </Button>
            <span className="text-white/80 text-sm">Back</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{getContextTitle()}</h1>
            <p className="opacity-90 mt-1">
              Create a free account to {finalFeatureName} and start building your personal collection of London's historic plaques
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Content */}
          <div className="space-y-6">
            {/* Header text */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
                What you can do with an account
              </h2>
              <p className="text-gray-600 mb-4">
                Join thousands of history enthusiasts exploring London's heritage with these powerful features.
              </p>
            </div>

            {/* Features list - context-specific */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="p-1.5 bg-gray-50 rounded-lg flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div> 

          {/* Right side - Registration form */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
              <div className="text-center mb-4 lg:mb-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">Create Your Account</h2>
                <p className="text-gray-600 text-sm">
                  Get started with your free Plaquer account
                </p>
              </div>

              {/* Google Sign Up Button */}
              <Button 
                type="button" 
                variant="outline"
                onClick={handleGoogleRegister}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 mb-4 lg:mb-6 py-3 h-auto"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLoading ? 'Creating account...' : 'Continue with Google'}
              </Button>

              {/* Divider */}
              <div className="relative mb-4 lg:mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300"></span>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500">or create with email</span>
                </div>
              </div>

              {/* Email Registration Form */}
              <form onSubmit={handleEmailRegister} className="space-y-3 lg:space-y-4">
                <div>
                  <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input 
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="John Smith"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="you@example.com"
                    disabled={isLoading}
                    required
                  />
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
                      placeholder="Create a password"
                      disabled={isLoading}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <label htmlFor="terms" className="text-xs lg:text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </label>
                </div>

                {/* Enhanced Error Display */}
                <AuthErrorDisplay
                  error={authError}
                  email={formData.email}
                  context="signup"
                  onRetry={() => setAuthError(null)}
                  onResetPassword={(email) => {
                    navigate('/forgot-password', { state: { email } });
                  }}
                  onSwitchToSignIn={handleSignIn}
                />

                <Button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium text-sm lg:text-base h-auto"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating account...
                    </>
                  ) : (
                    'Create Free Account'
                  )}
                </Button>
              </form>

              <div className="text-center mt-3 lg:mt-4">
                <p className="text-xs lg:text-sm text-gray-600">
                  Already have an account?{' '}
                  <button 
                    onClick={handleSignIn}
                    className="text-blue-600 hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Sign in
                  </button>
                </p>
              </div>

              {/* Trust indicators */}
              <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Check className="text-green-500" size={12} />
                    <span>100% Free</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="text-green-500" size={12} />
                    <span>Secure</span>
                  </div>
                </div>
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

export default AuthGate;