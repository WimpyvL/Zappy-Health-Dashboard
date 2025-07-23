// src/lib/firebase.ts
// This is the single source of truth for Firebase client-side initialization.
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isDevelopmentMode = process.env.NODE_ENV === 'development';
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    try {
      const newApp = initializeApp(firebaseConfig);
      console.log('🔥 Firebase app initialized.');
      return newApp;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }
  return getApp();
}

let authInstance: Auth | null = null;
function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
    if (isDevelopmentMode && useEmulator) {
      try {
        connectAuthEmulator(authInstance, 'http://localhost:9099');
        console.log('🔐 Connected to Auth emulator');
      } catch (e) {
        console.warn('🔐 Auth emulator already connected or connection failed.');
      }
    }
  }
  return authInstance;
}

let dbInstance: Firestore | null = null;
function getFirebaseFirestore(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
    if (isDevelopmentMode && useEmulator) {
      try {
        connectFirestoreEmulator(dbInstance, 'localhost', 8080);
        console.log('📡 Connected to Firestore emulator');
      } catch (e) {
        console.warn('📡 Firestore emulator already connected or connection failed.');
      }
    }
  }
  return dbInstance;
}

// Export the getter functions as the main interface
export { getFirebaseApp, getFirebaseFirestore, getFirebaseAuth, isDevelopmentMode };

// For backward compatibility with files expecting direct exports (less safe)
const app = getFirebaseApp();
const auth = getFirebaseAuth();
const db = getFirebaseFirestore();

export { app, auth, db };
