// src/components/auth/ForgotPasswordForm.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type ForgotPasswordFormProps = {
  onBackToLogin: () => void;
  onSuccess: () => void;
};

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBackToLogin}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to login
      </button>

      <p className="text-sm text-gray-600">
        Enter your email address below and we'll send you a link to reset your
        password.
      </p>

      {isSuccess ? (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          <p className="font-medium">Password reset email sent!</p>
          <p className="text-sm mt-1">
            Check your inbox for instructions to reset your password.
            Redirecting to login...
          </p>
        </div>
      ) : (
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

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Sending Reset Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
