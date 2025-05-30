// src/components/auth/AccountLinkingModal.tsx
import React, { useState } from 'react';
import { X, AlertTriangle, Link, Mail, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AccountLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  existingMethods: string[];
  suggestedAction: 'google' | 'signin' | 'signin-then-link';
  onSuccess?: () => void;
}

const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({
  isOpen,
  onClose,
  email,
  existingMethods,
  suggestedAction,
  onSuccess
}) => {
  const { signIn, signInWithGoogle, linkAccounts } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'choose' | 'signin' | 'link'>('choose');

  const hasGoogle = existingMethods.includes('google.com');
  const hasPassword = existingMethods.includes('password');

  const handleSignInAndLink = async () => {
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First sign in with password
      await signIn(email, password);
      
      if (suggestedAction === 'signin-then-link') {
        // User wants to link Google account
        setStep('link');
        toast.success('Signed in! Now you can link your Google account.');
      } else {
        // Just signing in
        toast.success('Welcome back!');
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      toast.success('Welcome back!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await linkAccounts('google', { email, password });
      toast.success('Google account linked successfully!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to link Google account');
      setIsLoading(false);
    }
  };

  const renderMethodBadges = () => (
    <div className="flex gap-2 mb-4">
      {hasPassword && (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          <Mail size={12} />
          Email & Password
        </div>
      )}
      {hasGoogle && (
        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
          <svg viewBox="0 0 24 24" className="w-3 h-3">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              Account Already Exists
            </DialogTitle>
            <button 
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              disabled={isLoading}
            >
              <X size={18} />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              An account with <strong>{email}</strong> already exists using:
            </AlertDescription>
          </Alert>

          {renderMethodBadges()}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Choose sign-in method */}
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please sign in with your existing method:
              </p>

              {hasGoogle && (
                <Button 
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              )}

              {hasPassword && (
                <>
                  {hasGoogle && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t"></span>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-gray-500">or</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          disabled={isLoading}
                          className="pr-10"
                          onKeyPress={(e) => e.key === 'Enter' && handleSignInAndLink()}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSignInAndLink}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Signing in...' : 'Sign In with Password'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Link Google account */}
          {step === 'link' && (
            <div className="space-y-4">
              <div className="text-center">
                <Link className="text-green-500 mx-auto mb-2" size={24} />
                <h3 className="font-medium">Link Your Google Account</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add Google sign-in to your account for easier access
                </p>
              </div>

              <Button 
onClick={handleLinkGoogle}
               disabled={isLoading}
               className="w-full flex items-center justify-center gap-2"
             >
               <svg viewBox="0 0 24 24" className="w-4 h-4">
                 <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                 <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                 <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                 <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
               </svg>
               {isLoading ? 'Linking Account...' : 'Link Google Account'}
             </Button>

             <Button 
               variant="outline"
               onClick={() => {
                 toast.success('Account access successful!');
                 onSuccess?.();
                 onClose();
               }}
               disabled={isLoading}
               className="w-full"
             >
               Skip for Now
             </Button>
           </div>
         )}

         {/* Help text */}
         <div className="text-xs text-gray-500 text-center">
           {step === 'choose' && (
             <>
               Don't remember your password?{' '}
               <button 
                 onClick={() => {
                   // You could trigger password reset here
                   onClose();
                   // navigate to forgot password with email pre-filled
                 }}
                 className="text-blue-600 hover:underline"
               >
                 Reset it here
               </button>
             </>
           )}
           {step === 'link' && (
             'Linking accounts allows you to sign in with either method'
           )}
         </div>
       </div>
     </DialogContent>
   </Dialog>
 );
};

export default AccountLinkingModal;