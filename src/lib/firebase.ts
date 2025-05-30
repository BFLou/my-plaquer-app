// src/lib/firebase.ts - Enhanced version with account linking
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
  User,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  AuthError
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Create provider instances
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Enable persistent sessions
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Auth persistence error:", error);
});

// Custom error types for better error handling
export interface AccountExistsError extends AuthError {
  email: string;
  existingMethods: string[];
  pendingCredential?: any;
}

// Helper to sanitize data for Firestore
const sanitizeForFirestore = (data: any): any => {
  const result: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      result[key] = null;
    } else if (typeof data[key] === 'object' && data[key] !== null) {
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
    
    if (!userDoc.exists()) {
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
        },
        // Track authentication methods
        authMethods: user.providerData.map(provider => provider.providerId)
      };
      
      const cleanProfile = sanitizeForFirestore(newProfile);
      await setDoc(userDocRef, cleanProfile);
      return newProfile;
    } else {
      // Update existing profile
      await setDoc(userDocRef, {
        lastActiveAt: serverTimestamp(),
        photoURL: user.photoURL || null,
        displayName: user.displayName || userDoc.data().displayName || 'User',
        authMethods: user.providerData.map(provider => provider.providerId)
      }, { merge: true });
      
      return userDoc.data();
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

// Check if email is already registered with different method
export const checkEmailExists = async (email: string) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return {
      exists: methods.length > 0,
      methods,
      hasPassword: methods.includes('password'),
      hasGoogle: methods.includes('google.com'),
      hasGithub: methods.includes('github.com')
    };
  } catch (error) {
    console.error('Error checking email:', error);
    return { exists: false, methods: [] };
  }
};

// Enhanced sign in with better error handling
export const signIn = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createOrUpdateUserProfile(result.user);
    return result;
  } catch (error: any) {
    console.error("Sign in error:", error.code, error.message);
    
    // Handle specific errors
    if (error.code === 'auth/user-not-found') {
      // Check if user exists with different method
      const emailCheck = await checkEmailExists(email);
      if (emailCheck.exists) {
        const customError: Partial<AccountExistsError> = {
          ...error,
          email,
          existingMethods: emailCheck.methods
        };
        throw customError;
      }
    }
    
    throw error;
  }
};

// Enhanced Google sign in with account linking
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    if (result.user) {
      await createOrUpdateUserProfile(result.user);
    }
    
    return result;
  } catch (error: any) {
    console.error("Google sign in error:", error);
    
    // Handle account exists with different credential
    if (error.code === 'auth/account-exists-with-different-credential') {
      const email = error.customData?.email;
      if (email) {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        
        const customError: Partial<AccountExistsError> = {
          ...error,
          email,
          existingMethods: methods,
          pendingCredential: GoogleAuthProvider.credentialFromError(error)
        };
        
        throw customError;
      }
    }
    
    throw error;
  }
};

// Enhanced registration with conflict detection
export const register = async (email: string, password: string, displayName: string) => {
  try {
    // First check if email exists with different method
    const emailCheck = await checkEmailExists(email);
    
    if (emailCheck.exists && !emailCheck.hasPassword) {
      // Email exists but not with password - offer to link accounts
      const customError: Partial<AccountExistsError> = {
        code: 'auth/email-exists-with-different-method',
        message: 'An account with this email already exists. Please sign in with your existing method or link your accounts.',
        email,
        existingMethods: emailCheck.methods
      } as AccountExistsError;
      
      throw customError;
    }
    
    // Proceed with normal registration
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await createOrUpdateUserProfile(userCredential.user);
    
    return userCredential;
  } catch (error: any) {
    console.error("Register error:", error);
    
    // Handle email already in use
    if (error.code === 'auth/email-already-in-use') {
      const emailCheck = await checkEmailExists(email);
      const customError: Partial<AccountExistsError> = {
        ...error,
        email,
        existingMethods: emailCheck.methods
      };
      throw customError;
    }
    
    throw error;
  }
};

// Link Google account to existing email/password account
export const linkGoogleAccount = async (email: string, password: string) => {
  try {
    // First sign in with email/password
    const emailCredential = EmailAuthProvider.credential(email, password);
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Then get Google credential
    const googleResult = await signInWithPopup(auth, googleProvider);
    const googleCredential = GoogleAuthProvider.credentialFromResult(googleResult);
    
    if (googleCredential && result.user) {
      // Link the accounts
      await linkWithCredential(result.user, googleCredential);
      await createOrUpdateUserProfile(result.user);
      
      return result.user;
    }
    
    throw new Error('Failed to get Google credential');
  } catch (error) {
    console.error('Error linking Google account:', error);
    throw error;
  }
};

// Link email/password to existing Google account
export const linkEmailPassword = async (password: string, displayName?: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user or email');
    }
    
    const emailCredential = EmailAuthProvider.credential(user.email, password);
    await linkWithCredential(user, emailCredential);
    
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    await createOrUpdateUserProfile(user);
    return user;
  } catch (error) {
    console.error('Error linking email/password:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    return await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Reset password error:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    return await authSignOut(auth);
  } catch (error: any) {
    console.error("Sign out error:", error);
    throw error;
  }
};

export { app, auth, db, storage };