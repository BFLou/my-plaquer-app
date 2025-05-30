// src/components/auth/AuthGate.tsx
import React, { useState } from 'react';
import { ArrowLeft, X, MapPin, FolderOpen, Route, Star, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from "@/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthModal from './AuthModal';

interface AuthGateProps {
  /** What feature the user was trying to access */
  featureName?: string;
  /** Where to redirect after successful auth */
  redirectTo?: string;
  /** Where the back button should go */
  backTo?: string;
}

const AuthGate: React.FC<AuthGateProps> = ({ 
  featureName = "advanced features",
  redirectTo = "/library", 
  backTo = "/discover"
}) => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'register'>('register');

  const handleBack = () => {
    navigate(backTo);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigate(redirectTo);
  };

  const handleOpenAuth = (type: 'login' | 'register') => {
    if (type === 'login') {
      // Navigate to dedicated sign-in page
      navigate('/signin', {
        state: {
          redirectTo,
          backTo
        }
      });
    } else {
      // Keep existing modal for registration
      setAuthType(type);
      setShowAuthModal(true);
    }
  };

  const features = [
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
            >
              <ArrowLeft size={18} />
            </Button>
            <span className="text-white/80 text-sm">Back to Discover</span>
          </div>

<div>
            <h1 className="text-3xl font-bold mb-2">Unlock More Features</h1>
  <p className="opacity-90 mt-1">
              Create a free account to unlock all features and start building your personal collection of London's historic plaques
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

            {/* Features list - more compact */}
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

            {/* Image placeholder - compact 
            <div className="mt-6">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-center h-32 lg:h-40">
                  <div className="text-center">
                    <div className="text-4xl lg:text-5xl mb-2">🎭</div>
                    <p className="text-blue-600 font-medium text-sm">Mascot exploring plaques</p>
                    <p className="text-xs text-blue-500">Illustration placeholder</p>
                  </div>
                </div>
              </div>
            </div> */}
          </div> 

          {/* Right side - Registration form */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
              <div className="text-center mb-4 lg:mb-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              </div>

              <div className="space-y-3 lg:space-y-4 mb-4 lg:mb-6">
                <div>
                  <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input 
                    id="displayName"
                    type="text"
                    className="mt-1"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input 
                    id="email"
                    type="email"
                    className="mt-1"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input 
                    id="password"
                    type="password"
                    className="mt-1"
                    placeholder="Create a password"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 mb-4 lg:mb-6">
                <input 
                  type="checkbox" 
                  id="terms"
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-xs lg:text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                </label>
              </div>

              <Button 
                onClick={() => handleOpenAuth('register')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium text-sm lg:text-base h-auto mb-3 lg:mb-4"
              >
                Create Free Account
              </Button>

              <div className="text-center">
                <p className="text-xs lg:text-sm text-gray-600">
                  Already have an account?{' '}
                  <button 
                    onClick={() => handleOpenAuth('login')}
                    className="text-blue-600 hover:underline font-medium"
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

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialTab={authType}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default AuthGate;