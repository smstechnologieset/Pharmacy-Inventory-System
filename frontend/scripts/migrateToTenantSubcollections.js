/* eslint-disable no-undef */
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = path.resolve(__dirname, "../.env.local");

const TENANT_COLLECTIONS = [
  "medicines",
  "stockBatches",
  "suppliers",
  "sales",
  "notifications",
  "stockMovements",
];

const parseEnv = (contents) =>
  contents
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split("=");
      acc[key.trim()] = rest.join("=").trim();
      return acc;
    }, {});

const loadEnv = async () => {
  try {
    const contents = await readFile(envFile, "utf8");
    return parseEnv(contents);
  } catch (err) {
    throw new Error(`Unable to read .env.local: ${err.message}`);
  }
};

const now = () => Timestamp.now();

const tenantDoc = (db, pharmacyId, collectionName, docId) =>
  doc(db, "pharmacies", pharmacyId, collectionName, docId);

const upsertTenantDoc = async (
  db,
  pharmacyId,
  collectionName,
  docId,
  data,
) => {
  await setDoc(
    tenantDoc(db, pharmacyId, collectionName, docId),
    {
      ...data,
      pharmacyId,
      migratedAt: data.migratedAt || now(),
    },
    { merge: true },
  );
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

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("Starting tenant subcollection migration...");

  const pharmacySnapshot = await getDocs(collection(db, "pharmacies"));
  if (pharmacySnapshot.empty) {
    console.log("No pharmacies found. Nothing to migrate.");
    return;
  }

  const totals = {
    tenants: pharmacySnapshot.size,
    migrated: 0,
    skipped: 0,
  };

  for (const pharmacyDoc of pharmacySnapshot.docs) {
    const pharmacyId = pharmacyDoc.id;
    const pharmacyData = pharmacyDoc.data();

    console.log(
      `\nMigrating tenant ${pharmacyId} (${pharmacyData.name || "unknown"})`,
    );

    totals.migrated += await migrateUsers(db, pharmacyId);
    totals.migrated += await migrateSettings(db, pharmacyId);
    totals.migrated += await migrateStats(db, pharmacyId);
    totals.migrated += await migrateCounters(db, pharmacyId);

    for (const collectionName of TENANT_COLLECTIONS) {
      totals.migrated += await migrateCollection(db, pharmacyId, collectionName);
    }
  }

  totals.skipped += await reportUnscopedDocs(db);

  console.log("\nMigration finished.");
  console.log(`Tenants scanned: ${totals.tenants}`);
  console.log(`Documents migrated/merged: ${totals.migrated}`);
  console.log(`Skipped legacy docs without pharmacyId: ${totals.skipped}`);
};

const migrateUsers = async (db, pharmacyId) => {
  const usersQuery = query(
    collection(db, "users"),
    where("pharmacyId", "==", pharmacyId),
  );
  const snapshot = await getDocs(usersQuery);

  if (snapshot.empty) {
    console.log("  users -> members: none");
    return 0;
  }

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    await upsertTenantDoc(db, pharmacyId, "members", userDoc.id, {
      ...data,
      uid: data.uid || userDoc.id,
      createdAt: data.createdAt || now(),
      updatedAt: data.updatedAt || now(),
    });
  }

  console.log(`  users -> members: ${snapshot.size}`);
  return snapshot.size;
};

const migrateSettings = async (db, pharmacyId) => {
  const directSettingsRef = doc(db, "settings", pharmacyId);
  const directSettingsSnap = await getDoc(directSettingsRef);

  let settingsData = directSettingsSnap.exists()
    ? directSettingsSnap.data()
    : null;

  if (!settingsData) {
    const settingsSnap = await getDocs(
      query(collection(db, "settings"), where("pharmacyId", "==", pharmacyId)),
    );
    settingsData = settingsSnap.empty ? null : settingsSnap.docs[0].data();
  }

  if (!settingsData) {
    console.log("  settings: none");
    return 0;
  }

  await upsertTenantDoc(db, pharmacyId, "settings", "settings", {
    ...settingsData,
    updatedAt: settingsData.updatedAt || now(),
  });

  console.log("  settings: 1");
  return 1;
};

const migrateStats = async (db, pharmacyId) => {
  let migrated = 0;

  const pharmacyStatsSnap = await getDoc(doc(db, "pharmacyStats", pharmacyId));
  if (pharmacyStatsSnap.exists()) {
    await upsertTenantDoc(db, pharmacyId, "stats", "pharmacy", {
      ...pharmacyStatsSnap.data(),
      kind: "pharmacy",
      updatedAt: pharmacyStatsSnap.data().updatedAt || now(),
    });
    migrated += 1;
  }

  const dailyStatsSnap = await getDocs(
    query(collection(db, "dailySalesStats"), where("pharmacyId", "==", pharmacyId)),
  );

  for (const statsDoc of dailyStatsSnap.docs) {
    const data = statsDoc.data();
    const date = data.date || statsDoc.id.replace(`${pharmacyId}_`, "");
    const docId = date ? `daily_${date}` : statsDoc.id;

    await upsertTenantDoc(db, pharmacyId, "stats", docId, {
      ...data,
      date,
      kind: "daily",
      updatedAt: data.updatedAt || now(),
    });
    migrated += 1;
  }

  console.log(`  stats: ${migrated}`);
  return migrated;
};

const migrateCounters = async (db, pharmacyId) => {
  const legacyCounterId = `${pharmacyId}_invoiceNumber`;
  const counterSnap = await getDoc(doc(db, "counters", legacyCounterId));

  if (!counterSnap.exists()) {
    console.log("  counters: none");
    return 0;
  }

  await upsertTenantDoc(db, pharmacyId, "counters", "invoiceNumber", {
    ...counterSnap.data(),
    updatedAt: counterSnap.data().updatedAt || now(),
  });

  console.log("  counters: 1");
  return 1;
};

const migrateCollection = async (db, pharmacyId, collectionName) => {
  const legacyQuery = query(
    collection(db, collectionName),
    where("pharmacyId", "==", pharmacyId),
  );
  const snapshot = await getDocs(legacyQuery);

  if (snapshot.empty) {
    console.log(`  ${collectionName}: none`);
    return 0;
  }

  for (const sourceDoc of snapshot.docs) {
    await upsertTenantDoc(
      db,
      pharmacyId,
      collectionName,
      sourceDoc.id,
      sourceDoc.data(),
    );
  }

  console.log(`  ${collectionName}: ${snapshot.size}`);
  return snapshot.size;
};

const reportUnscopedDocs = async (db) => {
  let skipped = 0;

  for (const collectionName of TENANT_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, collectionName));
    const missing = snapshot.docs.filter((sourceDoc) => {
      const data = sourceDoc.data();
      return !data.pharmacyId;
    });

    if (missing.length > 0) {
      skipped += missing.length;
      console.warn(
        `  skipped ${missing.length} ${collectionName} docs without pharmacyId`,
      );
    }
  }

  return skipped;
};

main().catch((error) => {
  console.error("Migration script failed:", error);
  process.exit(1);
});
