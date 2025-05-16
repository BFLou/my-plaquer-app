// src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  auth, 
  signIn as firebaseSignIn,
  register as firebaseRegister,
  resetPassword as firebaseResetPassword,
  signInWithGoogle as firebaseSignInWithGoogle,
  signInWithGithub as firebaseSignInWithGithub,
  signOut as firebaseSignOut
} from '@/lib/firebase';

// Define the auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, displayName: string) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  signInWithGithub: () => Promise<any>;
  signInWithFacebook: () => Promise<any>; // Placeholder
  signInWithTwitter: () => Promise<any>;  // Placeholder
  signOut: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // Facebook and Twitter auth are placeholders - you can implement these later if needed
  const signInWithFacebook = async () => {
    throw new Error('Facebook sign in not implemented yet');
  };

  const signInWithTwitter = async () => {
    throw new Error('Twitter sign in not implemented yet');
  };

  // Auth context value
  const value = {
    user,
    loading,
    signIn: firebaseSignIn,
    register: firebaseRegister,
    resetPassword: firebaseResetPassword,
    signInWithGoogle: firebaseSignInWithGoogle,
    signInWithGithub: firebaseSignInWithGithub,
    signInWithFacebook,
    signInWithTwitter,
    signOut: firebaseSignOut
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