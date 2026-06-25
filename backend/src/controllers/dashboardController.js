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

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { pharmacyId } = req.params;
  const lowStockThreshold = Number(req.query.lowStockThreshold || 10);
  const recentSalesLimit = Number(req.query.recentSalesLimit || 5);

  if (!pharmacyId) {
    return res.status(400).json({ error: "pharmacyId is required" });
  }

  const db = getFirestore();
  const todayKey = toUtcDateString(new Date());

  const pharmacyStatsDoc = await db
    .collection("pharmacyStats")
    .doc(pharmacyId)
    .get();
  const pharmacyStats = pharmacyStatsDoc.exists
    ? pharmacyStatsDoc.data()
    : { totalRevenue: 0, totalSalesCount: 0 };

  const dailySalesSnapshot = await db
    .collection("dailySalesStats")
    .where("pharmacyId", "==", pharmacyId)
    .orderBy("date", "asc")
    .get();
  const dailySalesStats = dailySalesSnapshot.docs.map((doc) => doc.data());

  const stockBatchSnapshot = await db
    .collection("stockBatches")
    .where("pharmacyId", "==", pharmacyId)
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

  const recentSalesSnapshot = await db
    .collection("sales")
    .where("pharmacyId", "==", pharmacyId)
    .orderBy("createdAt", "desc")
    .limit(recentSalesLimit)
    .get();

  const recentSales = recentSalesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

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
