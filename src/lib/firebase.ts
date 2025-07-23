// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

const isDevelopment = process.env.NODE_ENV === 'development';
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

// Use a global variable to track emulator connection status
const emulatorsConnected = (global as any).emulatorsConnected;


try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('🔥 Firebase app initialized.');
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);

  if (isDevelopment && useEmulator && !emulatorsConnected) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('🔐 Connected to Auth emulator');
    
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('📡 Connected to Firestore emulator');
    
    (global as any).emulatorsConnected = true;
  }
} catch (error) {
    console.error("Firebase initialization error:", error);
}


export { app, auth, db, isDevelopment };

export const getFirebaseFirestore = () => {
    if (!db) {
      console.error("Firestore is not initialized.");
    }
    return db;
};


export const getFirebaseAuth = () => {
    if (!auth) {
        console.error("Firebase Auth is not initialized.");
    }
    return auth;
};
