// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { Google, Github } from 'lucide-react';

type LoginFormProps = {
  onForgotPassword: () => void;
  onSuccess: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signInWithGoogle, signInWithGithub } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" 
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">Password</Label>
            <button 
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Input 
            id="password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
              Signing in...
            </>
          ) : 'Sign In'}
        </Button>
      </form>
      
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
    </div>
  );
};

export default LoginForm;