import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Required to get the current directory path in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    try {
      // Look for the JSON file in the root of the backend folder
      const serviceAccountPath = join(
        __dirname,
        "../../serviceAccountKey.json",
      );
      const serviceAccount = JSON.parse(
        readFileSync(serviceAccountPath, "utf8"),
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log(
        "✅ Firebase Admin SDK initialized successfully via JSON file",
      );
    } catch (error) {
      console.error("❌ Firebase Admin SDK initialization failed:", error);
      throw error;
    }
  }
  return admin;
};

export const getFirestore = () => admin.firestore();
