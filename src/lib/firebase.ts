// src/lib/firebase.ts
// Enhanced version with better typing, logging, and error handling

import { initializeApp, FirebaseOptions, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
  User,
  UserCredential,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  AuthProvider,
  linkWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  DocumentData,
  Firestore,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject,
  connectStorageEmulator,
  FirebaseStorage 
} from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';

// Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase once
let app: FirebaseApp | undefined;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

/**
 * Initialize Firebase services if not already initialized
 */
const initializeFirebase = () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    
    // Use emulators in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('Connected to Firebase emulators');
    }
    
    return { app, auth, db, storage, functions };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};

// Initialize and export services
const { app: initializedApp, auth: initializedAuth, db: initializedDb, storage: initializedStorage, functions: initializedFunctions } = initializeFirebase();

export const app = initializedApp;
export const auth = initializedAuth;
export const db = initializedDb;
export const storage = initializedStorage;
export const functions = initializedFunctions;

// Authentication utilities

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error signing in with email:', error.code, error.message);
    throw error;
  }
};

/**
 * Sign in with a popup for the given provider
 */
export const signInWithProvider = async (provider: AuthProvider): Promise<UserCredential> => {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error('Error signing in with provider:', error.code, error.message);
    throw error;
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  return signInWithProvider(provider);
};

/**
 * Sign in with GitHub
 */
export const signInWithGithub = async (): Promise<UserCredential> => {
  const provider = new GithubAuthProvider();
  return signInWithProvider(provider);
};

/**
 * Sign in with Facebook
 */
export const signInWithFacebook = async (): Promise<UserCredential> => {
  const provider = new FacebookAuthProvider();
  return signInWithProvider(provider);
};

/**
 * Sign in with Twitter
 */
export const signInWithTwitter = async (): Promise<UserCredential> => {
  const provider = new TwitterAuthProvider();
  return signInWithProvider(provider);
};

/**
 * Link current user with a new provider
 */
export const linkWithProvider = async (provider: AuthProvider): Promise<UserCredential> => {
  if (!auth.currentUser) {
    throw new Error('No user logged in');
  }
  
  try {
    return await linkWithPopup(auth.currentUser, provider);
  } catch (error: any) {
    console.error('Error linking with provider:', error.code, error.message);
    throw error;
  }
};

/**
 * Register a new user with email and password
 */
export const registerWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName
      });
    }
    
    return userCredential;
  } catch (error: any) {
    console.error('Error registering with email:', error.code, error.message);
    throw error;
  }
};

/**
 * Send a password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset:', error.code, error.message);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error.code, error.message);
    throw error;
  }
};

// User profile and upload utilities

/**
 * Upload a profile image for the current user
 */
export const uploadProfileImage = async (file: File): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('No user logged in');
  }
  
  try {
    const storageRef = ref(storage, `users/${auth.currentUser.uid}/profile.jpg`);
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update user profile
    await updateProfile(auth.currentUser, {
      photoURL: downloadURL
    });
    
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Create or update user profile data in Firestore
 */
export const updateUserProfile = async (data: Record<string, any>): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No user logged in');
  }
  
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(userRef, {
        ...data,
        updated_at: serverTimestamp()
      });
    } else {
      // Create new document
      await setDoc(userRef, {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Helper to check if Firebase is initialized properly
export const checkFirebaseInit = (): boolean => {
  try {
    return !!app && !!auth && !!db && !!storage;
  } catch (e) {
    return false;
  }
};

// Export firestore functions for convenience
export { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
};