// src/lib/firebase.ts
// This is the single source of truth for Firebase client-side initialization.
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";

// A robust singleton pattern for Firebase initialization
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isDevelopmentMode = process.env.NODE_ENV === 'development';

const initializeFirebase = () => {
  if (app) return; // Already initialized

  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('🔥 Firebase app initialized.');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      return;
    }
  } else {
    app = getApp();
  }

  // Initialize Firestore
  try {
    db = getFirestore(app);
    if (isDevelopmentMode && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('📡 Connected to Firestore emulator');
      } catch (e) {
        // This can happen with hot reloads, it's usually safe to ignore.
        console.warn('📡 Firestore emulator already connected or connection failed.');
      }
    }
  } catch (error) {
    console.error('❌ Firestore initialization failed:', error);
  }

  // Initialize Auth
  try {
    auth = getAuth(app);
    if (isDevelopmentMode && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
       try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('🔐 Connected to Auth emulator');
       } catch(e) {
         console.warn('🔐 Auth emulator already connected or connection failed.');
       }
    }
  } catch (error) {
    console.error('❌ Auth initialization failed:', error);
  }
};

// Ensure Firebase is initialized on first import
initializeFirebase();

// Export safe getter functions to ensure initialization before use
export const getFirebaseApp = () => {
  if (!app) initializeFirebase();
  return app;
};

export const getFirebaseFirestore = () => {
  if (!db) initializeFirebase();
  return db;
};

export const getFirebaseAuth = () => {
  if (!auth) initializeFirebase();
  return auth;
};

// Export the initialized instances directly for convenience
export { app, db, auth, isDevelopmentMode };
