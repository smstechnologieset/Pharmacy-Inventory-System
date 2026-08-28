import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Firebase configuration with environment variables and production fallbacks
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAmJDjHtlOIhX6ZT-ozpl_We-jE2n-QPKc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pharmacy-inventory-syste-e4a6c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pharmacy-inventory-syste-e4a6c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pharmacy-inventory-syste-e4a6c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "957513326558",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:957513326558:web:270bf7c5c6284b9cfbc74f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L9GH7CDRKN",
};

// Validate that all required config values are present
const requiredConfig = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

requiredConfig.forEach((key) => {
  if (!firebaseConfig[key]) {
    console.warn(`Firebase config missing: ${key}`);
  }
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});



export default app;
