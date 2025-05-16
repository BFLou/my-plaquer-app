// src/hooks/useAuth.tsx
import { useEffect, useState, useContext, createContext, ReactNode } from 'react';
import { 
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { app } from '@/lib/firebase';
import { toast } from 'sonner';

// Custom user type that extends Firebase User
interface User extends FirebaseUser {
  // Add any custom user properties here
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth(app);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser as User);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully');
    } catch (error: any) {
      // Handle specific error codes to provide more helpful messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else {
        throw error;
      }
    }
  };

  // Register a new user
  const register = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName
        });
      }
      
      toast.success('Account created successfully');
      return userCredential;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email is already in use');
      } else {
        throw error;
      }
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else {
        throw error;
      }
    }
  };

  // Update user profile
  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    try {
      await updateProfile(auth.currentUser, data);
      // Force refresh the user object
      setUser({ ...auth.currentUser } as User);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  // Sign out
  const signOut = () => {
    firebaseSignOut(auth).then(() => {
      // Optional: redirect to home page after logout
      navigate('/');
      toast.success('Signed out successfully');
    }).catch(error => {
      toast.error('Error signing out');
      console.error('Sign out error:', error);
    });
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google');
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed in with GitHub');
    } catch (error) {
      console.error('GitHub sign in error:', error);
      throw error;
    }
  };

  // Sign in with Facebook
  const signInWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Facebook');
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  };

  // Sign in with Twitter
  const signInWithTwitter = async () => {
    const provider = new TwitterAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Twitter');
    } catch (error) {
      console.error('Twitter sign in error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    register,
    resetPassword,
    signOut,
    signInWithGoogle,
    signInWithGithub,
    signInWithFacebook,
    signInWithTwitter,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};