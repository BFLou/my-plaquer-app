// src/contexts/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// User profile data structure
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  joinedAt: string;
  lastActiveAt: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    emailUpdates?: boolean;
  };
}

// User context type
interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// User provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore when the auth state changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // User profile exists in Firestore
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Create new user profile
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'User',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              joinedAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            };
            
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Update user profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) throw new Error('No authenticated user');
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Update Firestore
      await setDoc(userDocRef, {
        ...profile,
        ...data,
        lastActiveAt: new Date().toISOString(),
      }, { merge: true });
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    profile,
    loading,
    updateProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};