// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// This robust singleton pattern ensures Firebase is initialized only once.
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // In a real-world app, you might want to handle this more gracefully.
    // For now, we'll let it throw to make it clear something is wrong with the config.
    throw error;
  }
} else {
  app = getApp();
  console.log("Firebase app already initialized.");
}

db = getFirestore(app);

export { app, db };
