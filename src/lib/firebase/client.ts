
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// A more robust way to initialize Firebase in a Next.js environment
// This ensures we have a single instance of the app and db.
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

db = getFirestore(app);

export { app, db };
