// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";

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
let storage: FirebaseStorage;
let emulatorsConnected = false;

function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // In a real development environment, we'd use a condition like:
  // if (process.env.NODE_ENV === 'development' && !emulatorsConnected) {
  // However, to ensure it works in this specific Studio environment,
  // we will connect unconditionally.
  if (!emulatorsConnected) {
    console.log("Connecting to Firebase emulators...");
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      console.log("Successfully connected to Firebase emulators.");
      emulatorsConnected = true;
    } catch (error) {
      console.error("Error connecting to Firebase emulators:", error);
    }
  }
}

initializeFirebase();

export { app, auth, db, storage };

export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseFirestore = () => db;
export const getFirebaseStorage = () => storage;
