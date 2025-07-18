
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// A more robust way to initialize Firebase in a Next.js environment
// This ensures we have a single instance of the app and db.

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);

export { app, db };
