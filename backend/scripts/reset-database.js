/**
 * reset-database.js
 *
 * Wipes all test/pharmacy data from Firestore and Firebase Auth,
 * while PRESERVING:
 *   - The superadmin Firebase Auth account & Firestore profile (role = "superadmin")
 *   - The platformSettings document (subscription tiers configured by super admin)
 *
 * Usage:
 *   node scripts/reset-database.js
 *
 * Run from the /backend directory.
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const auth = admin.auth();

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Delete all documents in a collection (including subcollections). */
async function deleteCollection(collectionRef, batchSize = 100) {
  const snapshot = await collectionRef.limit(batchSize).get();
  if (snapshot.empty) return;

  // For each document, recursively delete subcollections first
  for (const doc of snapshot.docs) {
    const subCollections = await doc.ref.listCollections();
    for (const sub of subCollections) {
      await deleteCollection(sub, batchSize);
    }
    await doc.ref.delete();
  }

  // Recurse if there might be more
  if (snapshot.size === batchSize) {
    await deleteCollection(collectionRef, batchSize);
  }
}

/** Delete all Firebase Auth users except the ones whose UIDs are in the keepUids set. */
async function deleteAuthUsersExcept(keepUids) {
  let nextPageToken;
  let deletedCount = 0;
  const toDelete = [];

  do {
    const listResult = await auth.listUsers(1000, nextPageToken);
    for (const user of listResult.users) {
      if (!keepUids.has(user.uid)) {
        toDelete.push(user.uid);
      }
    }
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  // Delete in batches of 100
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    const result = await auth.deleteUsers(batch);
    deletedCount += result.successCount;
    if (result.errors.length > 0) {
      console.warn("  ⚠️  Some auth deletions failed:", result.errors);
    }
  }

  return deletedCount;
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║        PharmaCare Database Reset Tool        ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ── 1. Find superadmin UIDs to protect ──────────────────────
  console.log("🔍  Finding superadmin accounts to protect...");
  const superadminSnapshot = await db
    .collection("users")
    .where("role", "==", "superadmin")
    .get();

  const superadminUids = new Set(superadminSnapshot.docs.map((d) => d.id));
  if (superadminUids.size === 0) {
    console.warn("  ⚠️  No superadmin found — proceeding carefully.");
  } else {
    console.log(`  ✅  Protecting ${superadminUids.size} superadmin account(s): ${[...superadminUids].join(", ")}`);
  }

  // ── 2. Delete all non-superadmin Firestore users ─────────────
  console.log("\n🗑️   Deleting non-superadmin user profiles...");
  const allUsersSnap = await db.collection("users").get();
  let deletedUsers = 0;
  for (const doc of allUsersSnap.docs) {
    if (!superadminUids.has(doc.id)) {
      // Delete any subcollections first
      const subs = await doc.ref.listCollections();
      for (const sub of subs) await deleteCollection(sub);
      await doc.ref.delete();
      deletedUsers++;
    }
  }
  console.log(`  ✅  Deleted ${deletedUsers} user profile(s).`);

  // ── 3. Delete all pharmacies (+ subcollections) ───────────────
  console.log("\n🗑️   Deleting all pharmacies (members, payments, etc.)...");
  const pharmaciesRef = db.collection("pharmacies");
  const pharSnap = await pharmaciesRef.get();
  let deletedPharmacies = 0;
  for (const doc of pharSnap.docs) {
    const subs = await doc.ref.listCollections();
    for (const sub of subs) await deleteCollection(sub);
    await doc.ref.delete();
    deletedPharmacies++;
  }
  console.log(`  ✅  Deleted ${deletedPharmacies} pharmacy record(s).`);

  // ── 4. Delete any top-level payments collection ───────────────
  console.log("\n🗑️   Cleaning up any top-level payments collection...");
  const paymentsRef = db.collection("payments");
  const paySnap = await paymentsRef.get();
  if (!paySnap.empty) {
    await deleteCollection(paymentsRef);
    console.log(`  ✅  Deleted ${paySnap.size} payment record(s).`);
  } else {
    console.log("  ℹ️   No top-level payments found (expected).");
  }

  // ── 5. Delete Firebase Auth accounts (except superadmin) ──────
  console.log("\n🗑️   Deleting Firebase Auth accounts (except superadmin)...");
  const authDeletedCount = await deleteAuthUsersExcept(superadminUids);
  console.log(`  ✅  Deleted ${authDeletedCount} Firebase Auth account(s).`);

  // ── 6. Summary ────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║               Reset Complete! ✅             ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("\n📌 Preserved:");
  console.log("   • Superadmin account(s)");
  console.log("   • platformSettings (subscription tiers)");
  console.log("\n🚀 You can now start a fresh signup flow.\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Reset failed:", err);
  process.exit(1);
});
