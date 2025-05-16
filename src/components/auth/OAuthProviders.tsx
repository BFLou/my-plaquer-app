// src/components/auth/OAuthProviders.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Google, Github, Facebook, Twitter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
          <Google size={16} />
          <span>Google</span>
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={handleGithubSignIn}
          className="flex items-center justify-center gap-2"
        >
          <Github size={16} />
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
          <Facebook size={16} />
          <span>Facebook</span>
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={handleTwitterSignIn}
          className="flex items-center justify-center gap-2"
        >
          <Twitter size={16} />
          <span>Twitter</span>
        </Button>
      </div>
    </div>
  );
};

export default OAuthProviders;