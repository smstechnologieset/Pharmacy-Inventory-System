import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  getCountFromServer,
  getAggregateFromServer,
  sum,
} from "firebase/firestore";
import { db } from "./firebase";
import { STOCK_BATCHES_COLLECTION, SALES_COLLECTION } from "./collections";

export const subscribeToPharmacyStats = (pharmacyId, callback) => {
  const q = doc(db, "pharmacyStats", pharmacyId);
  return onSnapshot(q, (doc) =>
    callback(
      doc.exists() ? doc.data() : { totalRevenue: 0, totalSalesCount: 0 },
    ),
  );
};

export const subscribeToDailySalesStats = (pharmacyId, callback) => {
  const q = query(
    collection(db, "dailySalesStats"),
    where("pharmacyId", "==", pharmacyId),
    orderBy("date", "asc"),
  );
  return onSnapshot(q, (snapshot) =>
    callback(snapshot.docs.map((doc) => doc.data())),
  );
};

export const getDashboardStockStats = async (pharmacyId, settings) => {
  const batchesRef = collection(db, STOCK_BATCHES_COLLECTION);
  const qBase = query(
    batchesRef,
    where("pharmacyId", "==", pharmacyId),
    where("isDeleted", "==", false),
  );

  const totalStockAgg = await getAggregateFromServer(qBase, {
    total: sum("quantity"),
  });
  const totalBatchesSnap = await getCountFromServer(qBase);
  const outOfStockSnap = await getCountFromServer(
    query(qBase, where("quantity", "==", 0)),
  );
  const lowStockSnap = await getCountFromServer(
    query(
      qBase,
      where("quantity", ">", 0),
      where("quantity", "<=", Number(settings?.lowStockThreshold || 10)),
    ),
  );

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiredSnap = await getCountFromServer(
    query(qBase, where("expiry", "<", now)),
  );

  return {
    inventoryStock: totalStockAgg.data().total || 0,
    totalBatches: totalBatchesSnap.data().count || 0,
    outOfStock: outOfStockSnap.data().count || 0,
    lowStock: lowStockSnap.data().count || 0,
    expired: expiredSnap.data().count || 0,
  };
};

export const subscribeToRecentSales = (pharmacyId, limitCount, callback) => {
  const q = query(
    collection(db, SALES_COLLECTION),
    where("pharmacyId", "==", pharmacyId),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
  return onSnapshot(q, (snapshot) =>
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
  );
};

export const getRecentSales = async (pharmacyId, limitCount = 50) => {
  const q = query(
    collection(db, SALES_COLLECTION),
    where("pharmacyId", "==", pharmacyId),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getSalesByDateRange = async (pharmacyId, start, end) => {
  const q = query(
    collection(db, SALES_COLLECTION),
    where("pharmacyId", "==", pharmacyId),
    where("createdAt", ">=", start),
    where("createdAt", "<=", end),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
