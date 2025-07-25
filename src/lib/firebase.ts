// src/lib/firebase.ts
<<<<<<< HEAD
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { isDevelopment } from './utils';
=======
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";
>>>>>>> 09f51c1c02f6c4ac984835ff478df6040d66e12a

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
<<<<<<< HEAD

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
    
    // Dynamically import and connect to App Check emulator
    import('firebase/app-check').then(({ getAppCheck, connectAppCheckEmulator }) => {
      const appCheck = getAppCheck(app);
      connectAppCheckEmulator(appCheck, 'localhost:9090', { isTokenAutoRefreshEnabled: true });
      console.log('🔐 Connected to App Check Emulator.');
    }).catch(e => console.error("Error connecting to App Check emulator", e));

    (window as any)._firebaseEmulatorsConnected = true;
    console.log('🔥 Connected to Firebase Emulators (Auth, Firestore).');
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
=======
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

export { app, auth, db, storage };
>>>>>>> 09f51c1c02f6c4ac984835ff478df6040d66e12a
