// src/hooks/useAuth.tsx - Enhanced with account linking
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signIn as firebaseSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  register as firebaseRegister,
  resetPassword as firebaseResetPassword,
  signOut as firebaseSignOut,
  checkEmailExists,
  linkGoogleAccount,
  linkEmailPassword,
} from '@/lib/firebase';

// Enhanced auth context with account linking
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;

  // Basic auth methods
  signIn: (email: string, password: string) => Promise<any>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Social auth methods
  signInWithGoogle: () => Promise<any>;
  signInWithGithub: () => Promise<any>;
  signInWithFacebook: () => Promise<any>;
  signInWithTwitter: () => Promise<any>;

  // Account linking methods
  checkEmail: (email: string) => Promise<any>;
  linkAccounts: (
    method: 'google' | 'password',
    credentials: any
  ) => Promise<any>;

  // Utility methods
  clearError: () => void;
  getAuthMethods: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Enhanced sign in with conflict detection
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await firebaseSignIn(email, password);
      return result;
    } catch (error: any) {
      // Handle account exists with different method
      if (error.existingMethods) {
        const methods = error.existingMethods;
        let message = `An account with this email exists. `;

        if (methods.includes('google.com')) {
          message += 'Please sign in with Google, or link your accounts.';
        } else if (methods.includes('github.com')) {
          message += 'Please sign in with GitHub, or link your accounts.';
        } else {
          message += 'Please use your existing sign-in method.';
        }

        setError(message);

        // Return special error object for UI handling
        throw {
          ...error,
          canLink: true,
          availableMethods: methods,
        };
      }

      setError(error.message || 'Failed to sign in');
      throw error;
    }
  };

  // Enhanced registration with conflict detection
  const register = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      setError(null);
      const result = await firebaseRegister(email, password, displayName);
      return result;
    } catch (error: any) {
      // Handle email exists with different method
      if (
        error.code === 'auth/email-exists-with-different-method' ||
        error.existingMethods
      ) {
        const methods = error.existingMethods || [];
        let message = `An account with "${email}" already exists. `;

        if (methods.includes('google.com')) {
          message += 'Sign in with Google and add a password in settings, or ';
          message += 'continue with Google to access your account.';
        } else if (methods.includes('password')) {
          message += 'Please sign in with your existing password.';
        }

        setError(message);

        // Return special error for UI handling
        throw {
          ...error,
          canSignIn: true,
          existingMethods: methods,
          suggestedAction: methods.includes('google.com') ? 'google' : 'signin',
        };
      }

      setError(error.message || 'Failed to create account');
      throw error;
    }
  };

  // Enhanced Google sign in with account linking
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await firebaseSignInWithGoogle();
      return result;
    } catch (error: any) {
      // Handle account exists with different credential
      if (
        error.code === 'auth/account-exists-with-different-credential' ||
        error.existingMethods
      ) {
        const email = error.email;
        const methods = error.existingMethods || [];

        let message = `An account with "${email}" already exists. `;

        if (methods.includes('password')) {
          message +=
            'Please sign in with your password first, then link your Google account in settings.';
        }

        setError(message);

        throw {
          ...error,
          canLink: true,
          email,
          existingMethods: methods,
          suggestedAction: 'signin-then-link',
        };
      }

      setError(error.message || 'Failed to sign in with Google');
      throw error;
    }
  };

  // Check if email exists and what methods are available
  const checkEmail = async (email: string) => {
    try {
      return await checkEmailExists(email);
    } catch (error) {
      console.error('Error checking email:', error);
      return { exists: false, methods: [] };
    }
  };

  // Link accounts
  const linkAccounts = async (
    method: 'google' | 'password',
    credentials: any
  ) => {
    try {
      setError(null);

      if (method === 'google') {
        return await linkGoogleAccount(credentials.email, credentials.password);
      } else if (method === 'password') {
        return await linkEmailPassword(
          credentials.password,
          credentials.displayName
        );
      }

      throw new Error('Unsupported linking method');
    } catch (error: any) {
      setError(error.message || 'Failed to link accounts');
      throw error;
    }
  };

  // Get available auth methods for current user
  const getAuthMethods = () => {
    if (!user?.providerData) return [];
    return user.providerData.map((provider) => provider.providerId);
  };

  // Placeholder methods for future social auth
  const socialAuthNotImplemented = async () => {
    throw new Error(
      'This authentication method will be implemented in a future update'
    );
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    signIn,
    register,
    resetPassword: firebaseResetPassword,
    signOut: firebaseSignOut,
    signInWithGoogle,
    signInWithGithub: socialAuthNotImplemented,
    signInWithFacebook: socialAuthNotImplemented,
    signInWithTwitter: socialAuthNotImplemented,
    checkEmail,
    linkAccounts,
    clearError,
    getAuthMethods,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
