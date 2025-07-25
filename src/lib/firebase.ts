// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";
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
let storage: FirebaseStorage;

function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  if (isDevelopment() && typeof window !== 'undefined' && !(window as any)._firebaseEmulatorsConnected) {
    console.log('Running in development mode, connecting to emulators.');
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
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
    
    // Dynamically import and connect to App Check emulator
    import('firebase/app-check').then(({ getAppCheck, connectAppCheckEmulator }) => {
      const appCheck = getAppCheck(app);
      connectAppCheckEmulator(appCheck, 'localhost:9090', { isTokenAutoRefreshEnabled: true });
      console.log('🔐 Connected to App Check Emulator.');
    }).catch(e => console.error("Error connecting to App Check emulator", e));

    (window as any)._firebaseEmulatorsConnected = true;
  }
}

initializeFirebase();

export { app, auth, db, storage };

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

export const getFirebaseApp = (): FirebaseApp => {
    if (!app) {
        console.error("Firebase App is not initialized.");
        throw new Error("Firebase App not initialized");
    }
    return app;
}
