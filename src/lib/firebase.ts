// src/lib/firebase.ts
// This is the single source of truth for Firebase client-side initialization.
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration should be in environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A robust singleton pattern for Firebase initialization
let app: FirebaseApp;
let db: Firestore;

if (typeof window !== "undefined" && !getApps().length) {
  // This code runs only in the browser and only if Firebase hasn't been initialized yet.
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else if (getApps().length > 0) {
  // If the app is already initialized (e.g., on subsequent renders), get the existing instance.
  app = getApp();
  db = getFirestore(app);
}

// @ts-ignore - We initialize 'app' and 'db' inside the conditional logic, but TS can't infer it.
export { app, db };
