// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { isDevelopment } from './utils'; // Using a shared utility

const firebaseConfig = {
  apiKey: "AIzaSyBVV_vq5fjNSASYQndmbRbEtlfyOieFVTs",
  authDomain: "zappy-health-c1kob.firebaseapp.com",
  databaseURL: "https://zappy-health-c1kob-default-rtdb.firebaseio.com",
  projectId: "zappy-health-c1kob",
  storageBucket: "zappy-health-c1kob.firebasestorage.app",
  messagingSenderId: "833435237612",
  appId: "1:833435237612:web:53731373b2ad7568f279c9"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (isDevelopment) {
    console.log('Running in development mode, connecting to emulators.');
    // Set a flag on the window object to ensure emulators are only connected once.
    if (!(window as any)._firebaseEmulatorsConnected) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      (window as any)._firebaseEmulatorsConnected = true;
      console.log('🔐 Connected to Firebase Emulators.');
    }
  }
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

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
