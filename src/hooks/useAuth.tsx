// src/hooks/useAuth.tsx (Simplified for direct auth)
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  signIn as firebaseSignIn,
  register as firebaseRegister,
  resetPassword as firebaseResetPassword,
  signOut as firebaseSignOut
} from '@/lib/firebase';

// Define a simplified auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, displayName: string) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Placeholder methods that return errors (not implemented yet)
  signInWithGoogle: () => Promise<any>;
  signInWithGithub: () => Promise<any>;
  signInWithFacebook: () => Promise<any>;
  signInWithTwitter: () => Promise<any>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // For now, these methods return errors since we're focusing on direct auth
  const socialAuthNotImplemented = async () => {
    throw new Error('Social authentication is not implemented yet');
  };

  // Auth context value
  const value = {
    user,
    loading,
    error,
    signIn: firebaseSignIn,
    register: firebaseRegister,
    resetPassword: firebaseResetPassword,
    signOut: firebaseSignOut,
    // Placeholder methods
    signInWithGoogle: socialAuthNotImplemented,
    signInWithGithub: socialAuthNotImplemented,
    signInWithFacebook: socialAuthNotImplemented,
    signInWithTwitter: socialAuthNotImplemented
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};