import admin from "firebase-admin";
import { readFileSync } from "fs";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Required to get the current directory path in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    try {
      let serviceAccount;

      // Priority 1: Try to load from JSON environment variable (for Vercel/serverless)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
          serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
          );
          console.log("✅ Firebase loaded from FIREBASE_SERVICE_ACCOUNT_JSON");
        } catch (envError) {
          console.error(
            "❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:",
            envError.message,
          );
          throw envError;
        }
      }
      // Priority 2: Try to load direct Firebase env vars from .env
      else if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
      ) {
        serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        };
        console.log("✅ Firebase loaded from direct environment variables");
      }
      // Priority 3: Try to load from JSON file (for local development)
      else {
        const serviceAccountPath = join(
          __dirname,
          "../../serviceAccountKey.json",
        );

        if (!existsSync(serviceAccountPath)) {
          throw new Error(
            `Service account key file not found at ${serviceAccountPath}. ` +
              "For production/Vercel deployment, set FIREBASE_SERVICE_ACCOUNT_JSON environment variable or direct Firebase env vars.",
          );
        }

        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
        console.log("✅ Firebase loaded from serviceAccountKey.json file");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("✅ Firebase Admin SDK initialized successfully");
    } catch (error) {
      console.error(
        "❌ Firebase Admin SDK initialization failed:",
        error.message,
      );
      throw error;
    }
  }
  return admin;
};

export const getFirestore = () => admin.firestore();
