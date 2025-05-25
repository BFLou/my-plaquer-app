// src/services/profileService.ts
import { 
  updateProfile as updateAuthProfile} from 'firebase/auth';
import { 
  doc, 
  updateDoc,
  setDoc,
  getDoc 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { profileImageService } from './profileImageService';

export const profileService = {
  /**
   * Update user's display name in both Auth and Firestore
   */
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    try {
      // Update in Firebase Auth
      await updateAuthProfile(auth.currentUser, {
        displayName: displayName.trim()
      });
      
      // Update in Firestore
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
        lastUpdated: new Date().toISOString()
      });
      
      // Force auth state refresh
      await auth.currentUser.reload();
      
    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  },

  /**
   * Update user's profile completely
   */
  async updateProfile(userId: string, updates: {
    displayName?: string;
    bio?: string;
    photoURL?: string | null;
  }): Promise<void> {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    try {
      // Update Auth profile if displayName or photoURL changed
      const authUpdates: any = {};
      if (updates.displayName !== undefined) {
        authUpdates.displayName = updates.displayName.trim();
      }
      if (updates.photoURL !== undefined) {
        authUpdates.photoURL = updates.photoURL;
      }
      
      if (Object.keys(authUpdates).length > 0) {
        await updateAuthProfile(auth.currentUser, authUpdates);
      }
      
      // Update Firestore profile
      const userDocRef = doc(db, 'users', userId);
      const firestoreUpdates: any = {
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      // Ensure profile exists
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        // Create profile if it doesn't exist
        await setDoc(userDocRef, {
          uid: userId,
          email: auth.currentUser.email,
          ...firestoreUpdates,
          joinedAt: new Date().toISOString()
        });
      } else {
        // Update existing profile
        await updateDoc(userDocRef, firestoreUpdates);
      }
      
      // Force auth state refresh
      await auth.currentUser.reload();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Remove profile photo
   */
  async removeProfilePhoto(userId: string): Promise<void> {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    try {
      // Delete from Storage if it exists
      if (auth.currentUser.photoURL) {
        await profileImageService.deleteOldProfileImage(auth.currentUser.photoURL);
      }
      
      // Update Auth profile
      await updateAuthProfile(auth.currentUser, {
        photoURL: null
      });
      
      // Update Firestore
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        photoURL: null,
        lastUpdated: new Date().toISOString()
      });
      
      // Force auth state refresh
      await auth.currentUser.reload();
      
    } catch (error) {
      console.error('Error removing profile photo:', error);
      throw error;
    }
  },

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
};

export default profileService;