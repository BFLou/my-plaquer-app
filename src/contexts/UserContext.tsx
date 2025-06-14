// src/contexts/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
// Fix the import path - make sure it matches your project structure
import { useAuth } from '../hooks/useAuth'; // Adjust path if needed
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// User profile data structure
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  bio?: string | null;
  location?: string | null;
  joinedAt: string;
  lastActiveAt: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    emailUpdates?: boolean;
  } | null;
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
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
            // Create new user profile - MAKE SURE TO SANITIZE DATA TO REMOVE UNDEFINED VALUES
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'User',
              email: user.email || '',
              // Convert undefined to null for Firestore
              photoURL: user.photoURL || null,
              joinedAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            };

            // Clean the object to remove any undefined values before saving to Firestore
            const cleanProfile = sanitizeForFirestore(newProfile);

            await setDoc(userDocRef, cleanProfile);
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

  // Helper function to remove undefined values that Firestore doesn't support
  const sanitizeForFirestore = (data: any): any => {
    const result: any = {};

    // Remove undefined values, replace with null
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) {
        result[key] = null;
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        // Recursively sanitize nested objects
        result[key] = sanitizeForFirestore(data[key]);
      } else {
        result[key] = data[key];
      }
    });

    return result;
  };

  // Update user profile with sanitization for Firestore
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) throw new Error('No authenticated user');

    try {
      const userDocRef = doc(db, 'users', user.uid);

      // Clean the data before updating Firestore
      const cleanData = sanitizeForFirestore(data);

      // Update Firestore
      await setDoc(
        userDocRef,
        {
          ...profile,
          ...cleanData,
          lastActiveAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
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

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
