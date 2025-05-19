// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as authSignOut,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgiCu1ITfoKedWbU7v2DJ-YD0FhAbyHoo",
  authDomain: "plaquer-9a004.firebaseapp.com",
  projectId: "plaquer-9a004",
  storageBucket: "plaquer-9a004.firebaseapp.com",
  messagingSenderId: "240735688950",
  appId: "1:240735688950:web:212ca0fffe2d7db4e374d7",
  measurementId: "G-96E6N3PDYT"
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Create provider instances
const googleProvider = new GoogleAuthProvider();

// Configure Google provider (optional)
googleProvider.setCustomParameters({
  prompt: 'select_account' // Forces account selection even when one account is available
});

// Enable persistent sessions
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Auth persistence error:", error);
});

// Helper to sanitize data for Firestore
const sanitizeForFirestore = (data: any): any => {
  const result: any = {};
  
  // Remove undefined values, replace with null
  Object.keys(data).forEach(key => {
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

// Create or update user profile in Firestore
export const createOrUpdateUserProfile = async (user: User) => {
  if (!user) return null;
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    // If user document doesn't exist, create it
    if (!userDoc.exists()) {
      // Create new user profile
      const newProfile = {
        uid: user.uid,
        displayName: user.displayName || 'User',
        email: user.email || '',
        photoURL: user.photoURL || null,
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        preferences: {
          theme: 'light',
          notifications: true,
          emailUpdates: true,
        }
      };
      
      // Clean the object to remove any undefined values before saving to Firestore
      const cleanProfile = sanitizeForFirestore(newProfile);
      
      // Save to Firestore
      await setDoc(userDocRef, cleanProfile);
      return newProfile;
    } else {
      // Update last active timestamp
      await setDoc(userDocRef, {
        lastActiveAt: serverTimestamp(),
        // Update photo URL if it has changed
        photoURL: user.photoURL || null,
        // Update display name if it has changed
        displayName: user.displayName || userDoc.data().displayName || 'User'
      }, { merge: true });
      
      return userDoc.data();
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

// Authentication helpers with improved error handling
export const signIn = async (email: string, password: string) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error("Sign in error details:", error.code, error.message);
    throw error;
  }
};

// Add Google sign-in function
export const signInWithGoogle = async () => {
  try {
    // Sign in with Google
    const result = await signInWithPopup(auth, googleProvider);
    
    // Create or update user profile in Firestore
    if (result.user) {
      await createOrUpdateUserProfile(result.user);
    }
    
    return result;
  } catch (error: any) {
    console.error("Google sign in error:", error.code, error.message);
    throw error;
  }
};

export const register = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Create user profile in Firestore
    await createOrUpdateUserProfile(userCredential.user);
    
    return userCredential;
  } catch (error: any) {
    console.error("Register error details:", error.code, error.message);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    return await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Reset password error details:", error.code, error.message);
    throw error;
  }
};

export const signOut = async () => {
  try {
    return await authSignOut(auth);
  } catch (error: any) {
    console.error("Sign out error details:", error.code, error.message);
    throw error;
  }
};

// Export initialized services for use throughout the app
export { app, auth, db, storage };