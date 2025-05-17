// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';

type LoginFormProps = {
  onForgotPassword: () => void;
  onSuccess: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDebugInfo(null);
    setIsLoading(true);
    
    try {
      const userCredential = await signIn(email, password);
      console.log("Auth successful:", userCredential);
      onSuccess();
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Set user-friendly error message
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please check your email or register.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many unsuccessful login attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.code === 'auth/configuration-not-found') {
        errorMessage = 'Authentication configuration error. Please contact support.';
        setDebugInfo('This error typically occurs when Firebase does not recognize the domain. Check if localhost is added to authorized domains in Firebase console.');
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
            {debugInfo && (
              <div className="mt-2 pt-2 border-t border-red-200 text-xs">
                <strong>Debug info:</strong> {debugInfo}
              </div>
            )}
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
    </div>
  );
};

export default LoginForm;