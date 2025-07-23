// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBVV_vq5fjNSASYQndmbRbEtlfyOieFVTs",
  authDomain: "zappy-health-c1kob.firebaseapp.com",
  databaseURL: "https://zappy-health-c1kob-default-rtdb.firebaseio.com",
  projectId: "zappy-health-c1kob",
  storageBucket: "zappy-health-c1kob.appspot.com",
  messagingSenderId: "833435237612",
  appId: "1:833435237612:web:53731373b2ad7568f279c9"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

const isDevelopment = process.env.NODE_ENV === 'development';
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('🔥 Firebase app initialized.');
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);

  if (isDevelopment && useEmulator) {
    // Check if emulators are already connected to prevent re-connection errors
    if (!(auth as any)._emulatorUrl) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('🔐 Connected to Auth emulator');
    }
    
    // Firestore emulator connection check is more complex, relying on settings.
    // A simple check might involve checking the host. This is a basic approach.
    const dbSettings = (db as any)._settings;
    if (dbSettings && !dbSettings.host.includes('localhost')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('📡 Connected to Firestore emulator');
    }
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
