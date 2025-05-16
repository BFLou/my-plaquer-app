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
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

// Enable persistent sessions
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Auth persistence error:", error);
});

// Authentication helpers with improved error handling
export const signIn = async (email: string, password: string) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error("Sign in error details:", error.code, error.message);
    throw error;
  }
};

export const register = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
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