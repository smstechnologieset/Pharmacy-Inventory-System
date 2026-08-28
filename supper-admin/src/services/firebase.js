import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// ⚠️ Use the SAME Firebase project config as your client app
// Both apps share the same Firestore database and Auth instance
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAmJDjHtlOIhX6ZT-ozpl_We-jE2n-QPKc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pharmacy-inventory-syste-e4a6c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pharmacy-inventory-syste-e4a6c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pharmacy-inventory-syste-e4a6c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "957513326558",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:957513326558:web:270bf7c5c6284b9cfbc74f",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);