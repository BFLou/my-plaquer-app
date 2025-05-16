// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as authSignOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyDgiCu1ITfoKedWbU7v2DJ-YD0FhAbyHoo",
  authDomain: "plaquer-9a004.firebaseapp.com",
  projectId: "plaquer-9a004",
  storageBucket: "plaquer-9a004.firebaseapp.com", // Note: corrected this from firebasestorage.app
  messagingSenderId: "240735688950",
  appId: "1:240735688950:web:212ca0fffe2d7db4e374d7",
  measurementId: "G-96E6N3PDYT"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const analytics = getAnalytics(app);

// Authentication helpers
export const signIn = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const register = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  return userCredential;
};

export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// Social auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = async () => {
  return signInWithPopup(auth, googleProvider);
};

export const signInWithGithub = async () => {
  return signInWithPopup(auth, githubProvider);
};

export const signOut = async () => {
  return authSignOut(auth);
};

// Export initialized services for use throughout the app
export { app, auth, db, storage, functions, analytics };