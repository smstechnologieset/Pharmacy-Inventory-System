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

async function migrateStats() {
  console.log("🚀 Starting Stats Migration...");

  try {
    const salesSnapshot = await db.collection("sales").get();
    console.log(`Found ${salesSnapshot.size} sales to process.`);

    const pharmacyStatsMap = new Map(); // pharmacyId -> { totalRevenue, totalSalesCount }
    const dailySalesStatsMap = new Map(); // `${pharmacyId}_${YYYY-MM-DD}` -> { revenue, salesCount, date, pharmacyId }

    salesSnapshot.forEach((doc) => {
      const sale = doc.data();
      const pharmacyId = sale.pharmacyId;
      if (!pharmacyId) return;

      const total = Number(sale.total || sale.amount || 0);

      // Pharmacy Stats
      if (!pharmacyStatsMap.has(pharmacyId)) {
        pharmacyStatsMap.set(pharmacyId, { totalRevenue: 0, totalSalesCount: 0 });
      }
      const pStats = pharmacyStatsMap.get(pharmacyId);
      pStats.totalRevenue += total;
      pStats.totalSalesCount += 1;

      // Daily Stats
      let dateStr;
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date();
      if (!isNaN(saleDate)) {
        dateStr = saleDate.toISOString().slice(0, 10);
      } else {
        dateStr = new Date().toISOString().slice(0, 10);
      }

      const dailyKey = `${pharmacyId}_${dateStr}`;
      if (!dailySalesStatsMap.has(dailyKey)) {
        dailySalesStatsMap.set(dailyKey, { revenue: 0, salesCount: 0, date: dateStr, pharmacyId });
      }
      const dStats = dailySalesStatsMap.get(dailyKey);
      dStats.revenue += total;
      dStats.salesCount += 1;
    });

    console.log(`Updating ${pharmacyStatsMap.size} pharmacyStats documents...`);
    const batch = db.batch();

    for (const [pharmacyId, stats] of pharmacyStatsMap.entries()) {
      const ref = db.collection("pharmacyStats").doc(pharmacyId);
      batch.set(ref, {
        totalRevenue: stats.totalRevenue,
        totalSalesCount: stats.totalSalesCount,
        pharmacyId,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    console.log(`Updating ${dailySalesStatsMap.size} dailySalesStats documents...`);
    for (const [key, stats] of dailySalesStatsMap.entries()) {
      const ref = db.collection("dailySalesStats").doc(key);
      batch.set(ref, {
        revenue: stats.revenue,
        salesCount: stats.salesCount,
        date: stats.date,
        pharmacyId: stats.pharmacyId,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    await batch.commit();
    console.log("✅ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

migrateStats();
