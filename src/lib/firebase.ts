// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";

// Default config for development/testing when no environment variables are available
const defaultConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};

// Use environment variables if available, otherwise fall back to defaults
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || defaultConfig.appId,
};

const isDevelopmentMode = process.env.NODE_ENV === 'development';
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV === 'production';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initializeFirebase() {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn("Firebase initialization failed:", error);
    
    // Create mock objects during build time to prevent errors
    if (isBuildTime) {
      console.warn("Using mock Firebase objects for build");
      
      // @ts-ignore - Creating mock objects for build
      app = {} as FirebaseApp;
      // @ts-ignore - Creating mock objects for build
      auth = { currentUser: null } as Auth;
      // @ts-ignore - Creating mock objects for build
      db = {} as Firestore;
      // @ts-ignore - Creating mock objects for build
      storage = {} as FirebaseStorage;
    }
  }

  if (isDevelopmentMode && useEmulator) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('🔐 Connected to Auth emulator');
    } catch (e) {
      console.warn('🔐 Auth emulator already connected or connection failed.');
    }
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('📡 Connected to Firestore emulator');
    } catch (e) {
      console.warn('📡 Firestore emulator already connected or connection failed.');
    }
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('📦 Connected to Storage emulator');
    } catch (e) {
      console.warn('📦 Storage emulator already connected or connection failed.');
    }
  }
}

initializeFirebase();

// Exported instances
export { app, auth, db, storage };

// Helper functions to get Firebase services
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseFirestore = () => db;
export const getFirebaseStorage = () => storage;
