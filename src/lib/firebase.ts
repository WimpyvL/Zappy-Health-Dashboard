// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getAppCheck, connectAppCheckEmulator } from 'firebase/app-check';
import { isDevelopment } from './utils';

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

const initializeFirebaseApp = () => {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
};

app = initializeFirebaseApp();
auth = getAuth(app);
db = getFirestore(app);

if (typeof window !== 'undefined' && isDevelopment()) {
  console.log('Running in development mode, connecting to emulators.');
  // Set a flag on the window object to ensure emulators are only connected once.
  if (!(window as any)._firebaseEmulatorsConnected) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Connect to App Check emulator
    const appCheck = getAppCheck(app);
    connectAppCheckEmulator(appCheck, 'localhost', 9090);

    (window as any)._firebaseEmulatorsConnected = true;
    console.log('🔐 Connected to Firebase Emulators (Auth, Firestore, App Check).');
  }
}


export { app, auth, db };

export const getFirebaseFirestore = (): Firestore => {
    if (!db) {
      console.error("Firestore is not initialized.");
      throw new Error("Firestore not initialized");
    }
    return db;
};


export const getFirebaseAuth = (): Auth => {
    if (!auth) {
        console.error("Firebase Auth is not initialized.");
        throw new Error("Firebase Auth not initialized");
    }
    return auth;
};