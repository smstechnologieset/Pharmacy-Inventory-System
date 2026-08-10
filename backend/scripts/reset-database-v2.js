/**
 * reset-database-v2.js
 *
 * Faster version using db.recursiveDelete() for pharmacy collections.
 * Wipes all test/pharmacy data from Firestore and Firebase Auth,
 * while PRESERVING:
 *   - Superadmin Firebase Auth accounts & Firestore profiles (role = "superadmin")
 *   - platformSettings document (subscription tiers)
 *
 * Usage:
 *   node scripts/reset-database-v2.js
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

/** Delete all Firebase Auth users EXCEPT those in keepUids. */
async function deleteAuthUsersExcept(keepUids) {
  let nextPageToken;
  const toDelete = [];

  do {
    const listResult = await auth.listUsers(1000, nextPageToken);
    for (const user of listResult.users) {
      if (!keepUids.has(user.uid)) toDelete.push(user.uid);
    }
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  if (toDelete.length === 0) return 0;

  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    const result = await auth.deleteUsers(batch);
    deleted += result.successCount;
    if (result.errors.length > 0) {
      console.warn("  ⚠️  Some auth deletions failed:", result.errors);
    }
  }
  return deleted;
}

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║      PharmaCare Database Reset Tool v2       ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ── 1. Identify superadmins to protect ──────────────────────
  console.log("🔍  Finding superadmin accounts to protect...");
  const superadminSnap = await db.collection("users").where("role", "==", "superadmin").get();
  const superadminUids = new Set(superadminSnap.docs.map((d) => d.id));
  console.log(`  ✅  Protecting ${superadminUids.size} superadmin(s).`);

  // ── 2. Delete non-superadmin Firestore user profiles ─────────
  console.log("\n🗑️   Deleting non-superadmin user profiles...");
  const allUsersSnap = await db.collection("users").get();
  const userBatch = db.batch();
  let userCount = 0;
  for (const doc of allUsersSnap.docs) {
    if (!superadminUids.has(doc.id)) {
      userBatch.delete(doc.ref);
      userCount++;
    }
  }
  if (userCount > 0) await userBatch.commit();
  console.log(`  ✅  Deleted ${userCount} user profile(s).`);

  // ── 3. Recursively delete all pharmacies (fast path) ─────────
  console.log("\n🗑️   Deleting all pharmacies (recursively)...");
  const pharSnap = await db.collection("pharmacies").get();
  console.log(`  Found ${pharSnap.size} pharmacy record(s). Deleting...`);
  let pharCount = 0;
  for (const doc of pharSnap.docs) {
    // recursiveDelete handles all subcollections (members, payments, etc.)
    await db.recursiveDelete(doc.ref);
    pharCount++;
    process.stdout.write(`\r  Deleted ${pharCount}/${pharSnap.size} pharmacies...`);
  }
  console.log(`\n  ✅  Deleted ${pharCount} pharmacy record(s).`);

  // ── 4. Clean up any top-level payments collection ─────────────
  console.log("\n🗑️   Cleaning up top-level payments collection...");
  const paySnap = await db.collection("payments").get();
  if (!paySnap.empty) {
    await db.recursiveDelete(db.collection("payments"));
    console.log(`  ✅  Deleted ${paySnap.size} payment record(s).`);
  } else {
    console.log("  ℹ️   No top-level payments found.");
  }

  // ── 5. Delete Firebase Auth accounts ─────────────────────────
  console.log("\n🗑️   Deleting Firebase Auth accounts (except superadmin)...");
  const authDeleted = await deleteAuthUsersExcept(superadminUids);
  console.log(`  ✅  Deleted ${authDeleted} Firebase Auth account(s).`);

  // ── 6. Done ───────────────────────────────────────────────────
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
  console.error("\n❌ Reset failed:", err.message);
  process.exit(1);
});
