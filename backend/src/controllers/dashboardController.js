import { getFirestore } from "../config/firebase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const normalizeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toUtcDateString = (value) => {
  if (!value) return null;
  if (value.toDate) value = value.toDate();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

// Helper to convert Timestamps to full ISO strings for recent sales
const toISOString = (value) => {
  if (!value) return null;
  if (value.toDate) value = value.toDate();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { pharmacyId } = req.params;
  const lowStockThreshold = Number(req.query.lowStockThreshold || 10);
  const recentSalesLimit = Number(req.query.recentSalesLimit || 5);

  if (!pharmacyId) {
    return res.status(400).json({ error: "pharmacyId is required" });
  }

  const db = getFirestore();
  const todayKey = toUtcDateString(new Date());
  const tenantRoot = db.collection("pharmacies").doc(pharmacyId);

  // 1. Pharmacy Stats
  const pharmacyStatsDoc = await tenantRoot
    .collection("stats")
    .doc("pharmacy")
    .get();
  const pharmacyStats = pharmacyStatsDoc.exists
    ? pharmacyStatsDoc.data()
    : { totalRevenue: 0, totalSalesCount: 0 };

  // 2. Daily Sales Stats (Removed orderBy to avoid Firestore composite index errors)
  const dailySalesSnapshot = await tenantRoot
    .collection("stats")
    .where("kind", "==", "daily")
    .get();

  const dailySalesStats = dailySalesSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        ...data,
        date: toUtcDateString(data.date), // Convert Timestamp to "YYYY-MM-DD" string
      };
    })
    .sort((a, b) => {
      if (!a.date) return -1;
      if (!b.date) return 1;
      return a.date.localeCompare(b.date); // Sort in memory instead
    });

  // 3. Stock Stats
  const stockBatchSnapshot = await tenantRoot
    .collection("stockBatches")
    .where("isDeleted", "==", false)
    .get();

  let inventoryStock = 0;
  let totalBatches = 0;
  let outOfStock = 0;
  let lowStock = 0;
  let expired = 0;

  stockBatchSnapshot.docs.forEach((doc) => {
    const batch = doc.data();
    const quantity = normalizeNumber(batch.quantity);
    const expiryKey = toUtcDateString(batch.expiry);

    inventoryStock += quantity;
    totalBatches += 1;

    if (quantity === 0) {
      outOfStock += 1;
    } else if (quantity <= lowStockThreshold) {
      lowStock += 1;
    }

    if (expiryKey && expiryKey < todayKey) {
      expired += 1;
    }
  });

  // 4. Recent Sales
  const recentSalesSnapshot = await tenantRoot
    .collection("sales")
    .orderBy("createdAt", "desc")
    .limit(recentSalesLimit)
    .get();

  const recentSales = recentSalesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: toISOString(data.createdAt), // Convert Timestamp to ISO string
    };
  });

  res.json({
    pharmacyStats,
    dailySalesStats,
    stockStats: {
      inventoryStock,
      totalBatches,
      outOfStock,
      lowStock,
      expired,
    },
    recentSales,
  });
});
