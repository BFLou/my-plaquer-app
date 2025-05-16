// src/components/auth/OAuthProviders.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { GithubIcon } from 'lucide-react';

// Custom SVG icons for the providers
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

interface OAuthProvidersProps {
  onSuccess: () => void;
  setError: (error: string | null) => void;
}

const OAuthProviders: React.FC<OAuthProvidersProps> = ({ onSuccess, setError }) => {
  const { 
    signInWithGoogle, 
    signInWithGithub, 
    signInWithFacebook, 
    signInWithTwitter 
  } = useAuth();

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    try {
      await signInWithGithub();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with GitHub.');
    }
  };

  const handleFacebookSignIn = async () => {
    setError(null);
    try {
      await signInWithFacebook();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Facebook.');
    }
  };

  const handleTwitterSignIn = async () => {
    setError(null);
    try {
      await signInWithTwitter();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Twitter.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-500">or continue with</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          type="button" 
          variant="outline"
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          <span>Google</span>
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={handleGithubSignIn}
          className="flex items-center justify-center gap-2"
        >
          <GithubIcon size={16} />
          <span>GitHub</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          type="button" 
          variant="outline"
          onClick={handleFacebookSignIn}
          className="flex items-center justify-center gap-2"
        >
          <FacebookIcon />
          <span>Facebook</span>
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={handleTwitterSignIn}
          className="flex items-center justify-center gap-2"
        >
          <TwitterIcon />
          <span>Twitter</span>
        </Button>
      </div>
    </div>
  );
};

export default OAuthProviders;