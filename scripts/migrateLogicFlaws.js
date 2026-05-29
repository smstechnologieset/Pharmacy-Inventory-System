import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    "❌ Error: serviceAccountKey.json not found in the scripts directory."
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const COLLECTIONS_TO_PATCH = ["medicines", "stockBatches", "suppliers", "users"];

async function addIsDeletedField() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Phase 1: Adding isDeleted: false to all documents");
  console.log("═══════════════════════════════════════════════════");

  for (const collectionName of COLLECTIONS_TO_PATCH) {
    const snapshot = await db.collection(collectionName).get();
    let updatedCount = 0;

    // Firestore batch writes max 500 ops. Use chunking.
    const chunks = [];
    let currentBatch = db.batch();
    let opsInBatch = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Only patch if the field is missing
      if (data.isDeleted === undefined) {
        currentBatch.update(docSnap.ref, { isDeleted: false });
        opsInBatch++;
        updatedCount++;

        if (opsInBatch >= 499) {
          chunks.push(currentBatch);
          currentBatch = db.batch();
          opsInBatch = 0;
        }
      }
    }

    if (opsInBatch > 0) {
      chunks.push(currentBatch);
    }

    for (const batch of chunks) {
      await batch.commit();
    }

    console.log(`  ✅ ${collectionName}: Patched ${updatedCount}/${snapshot.size} docs`);
  }
}

async function aggregateTotalStock() {
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("  Phase 2: Aggregating totalStock on medicines");
  console.log("═══════════════════════════════════════════════════");

  const medicinesSnap = await db.collection("medicines").get();
  const batchesSnap = await db.collection("stockBatches").get();

  // Build a map: medicineId -> total quantity from non-deleted batches
  const stockMap = new Map();

  for (const batchDoc of batchesSnap.docs) {
    const data = batchDoc.data();
    if (data.isDeleted === true) continue; // Skip soft-deleted batches

    const medId = data.medicineId;
    if (!medId) continue;

    const qty = Number(data.quantity || 0);
    stockMap.set(medId, (stockMap.get(medId) || 0) + qty);
  }

  let updatedCount = 0;
  const chunks = [];
  let currentBatch = db.batch();
  let opsInBatch = 0;

  for (const medDoc of medicinesSnap.docs) {
    const totalStock = stockMap.get(medDoc.id) || 0;
    const currentTotalStock = medDoc.data().totalStock;

    // Only update if needed
    if (currentTotalStock !== totalStock) {
      currentBatch.update(medDoc.ref, { totalStock });
      opsInBatch++;
      updatedCount++;

      if (opsInBatch >= 499) {
        chunks.push(currentBatch);
        currentBatch = db.batch();
        opsInBatch = 0;
      }
    }
  }

  if (opsInBatch > 0) {
    chunks.push(currentBatch);
  }

  for (const batch of chunks) {
    await batch.commit();
  }

  console.log(`  ✅ Updated totalStock on ${updatedCount}/${medicinesSnap.size} medicines`);
  
  // Log a summary
  console.log("");
  console.log("  Stock Summary:");
  for (const [medId, total] of stockMap.entries()) {
    const medDoc = medicinesSnap.docs.find(d => d.id === medId);
    const name = medDoc?.data()?.name || medId;
    console.log(`    ${name}: ${total} units`);
  }
}

async function main() {
  console.log("🚀 Starting Logic Flaws Migration...\n");

  try {
    await addIsDeletedField();
    await aggregateTotalStock();

    console.log("\n══════════════════════════════════════════════");
    console.log("  ✅ Migration completed successfully!");
    console.log("══════════════════════════════════════════════\n");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
