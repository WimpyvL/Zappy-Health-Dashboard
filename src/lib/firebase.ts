// src/lib/firebase.ts
// This is the single source of truth for Firebase client-side initialization.
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";

// Check if we have valid Firebase configuration
const hasValidFirebaseConfig = () => {
  const requiredEnvVars = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ];
  
  return requiredEnvVars.every(envVar => 
    envVar && 
    envVar !== 'your_firebase_api_key' && 
    envVar !== 'your_project.firebaseapp.com' &&
    envVar !== 'your_project_id'
  );
};

// Development/Demo Firebase configuration (fallback when real config is not available)
const developmentConfig = {
  apiKey: "demo-api-key-for-development",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo-app-id",
};

// Production Firebase configuration from environment variables
const productionConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Use production config if valid, otherwise use development config
const firebaseConfig = hasValidFirebaseConfig() ? productionConfig : developmentConfig;
const isDevelopmentMode = !hasValidFirebaseConfig();

// A robust singleton pattern for Firebase initialization
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Safe Firebase initialization function
const initializeFirebaseApp = () => {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      
      if (isDevelopmentMode) {
        console.warn('🔥 Firebase initialized in DEVELOPMENT mode with demo credentials');
        console.warn('📝 Add real Firebase credentials to .env.local for production features');
      }
    } else {
      app = getApp();
    }
    
    return app;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return null;
  }
};

// Safe Firestore initialization
const initializeFirestore = (firebaseApp: FirebaseApp | null) => {
  if (!firebaseApp) return null;
  
  try {
    const firestore = getFirestore(firebaseApp);
    
    // Only connect to emulator if explicitly enabled via environment variable
    if (isDevelopmentMode && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
        console.log('📡 Connected to Firestore emulator');
      } catch (error) {
        console.log('📡 Firestore emulator connection failed, continuing without it');
      }
    }
    
    return firestore;
  } catch (error) {
    console.error('❌ Firestore initialization failed:', error);
    return null;
  }
};

// Safe Auth initialization
const initializeAuth = (firebaseApp: FirebaseApp | null) => {
  if (!firebaseApp) return null;
  
  try {
    const authentication = getAuth(firebaseApp);
    
    // Only connect to emulator if explicitly enabled via environment variable
    if (isDevelopmentMode && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(authentication, 'http://localhost:9099');
        console.log('🔐 Connected to Auth emulator');
      } catch (error) {
        console.log('🔐 Auth emulator connection failed, continuing without it');
      }
    }
    
    return authentication;
  } catch (error) {
    console.error('❌ Auth initialization failed:', error);
    return null;
  }
};

// Initialize Firebase services
app = initializeFirebaseApp();
db = initializeFirestore(app);
auth = initializeAuth(app);


// Export services with null checks
export { app, db, auth, isDevelopmentMode };

// Export safe getter functions
export const getFirebaseApp = () => {
  if (!app) {
    app = initializeFirebaseApp();
  }
  return app;
};

export const getFirebaseFirestore = () => {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    db = initializeFirestore(firebaseApp);
  }
  return db;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = initializeAuth(firebaseApp);
  }
  return auth;
};


// Example of how to use in a component:
// import { getFirebaseFirestore } from '@/lib/firebase';
// const db = getFirebaseFirestore();
// Now you can use `db` to interact with Firestore.

