/* eslint-disable no-undef */
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { medicines, suppliers } from "../src/data/mockData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = path.resolve(__dirname, "../.env.local");

const parseEnv = (contents) => {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split("=");
      acc[key.trim()] = rest.join("=").trim();
      return acc;
    }, {});
};

const loadEnv = async () => {
  try {
    const contents = await readFile(envFile, "utf8");
    return parseEnv(contents);
  } catch {
    throw new Error(
      `Unable to read .env.local. Create one with your Firebase config or pass env vars directly.`,
    );
  }
};

const abort = (message) => {
  console.error(message);
  process.exit(1);
};

const main = async () => {
  const env = await loadEnv();
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    abort(
      `Missing Firebase config values in .env.local: ${missingKeys.join(", ")}`,
    );
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const collections = [
    { name: "medicines", items: medicines },
    { name: "suppliers", items: suppliers },
  ];

  for (const collectionEntry of collections) {
    console.log(`Seeding collection: ${collectionEntry.name}`);
    for (const item of collectionEntry.items) {
      const { id: legacyId, ...payload } = item;
      const itemData = {
        ...payload,
        legacyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(
        collection(db, collectionEntry.name),
        itemData,
      );
      console.log(`  - seeded ${collectionEntry.name}/${docRef.id}`);
    }
  }

  console.log("Seeding complete.");
};

main().catch((error) => {
  console.error("Seeding failed:", error.message || error);
  process.exit(1);
});
