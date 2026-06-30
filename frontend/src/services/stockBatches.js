import {
  doc,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
  increment,
  getCountFromServer,
  getAggregateFromServer,
  sum,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { STOCK_BATCHES_COLLECTION, MEDICINES_COLLECTION } from "./collections";
import { tenantCollection, tenantDoc } from "./firestorePaths.js";

export const createStockMovement = async (movement, pharmacyId) => {
  try {
    await addDoc(tenantCollection(pharmacyId, "stockMovements"), {
      ...movement,
      pharmacyId: pharmacyId || null,
      timestamp: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error logging stock movement:", error);
    return false;
  }
};

export const getAllStockBatches = async (pharmacyId) => {
  try {
    if (!pharmacyId) throw new Error("pharmacyId is required");
    const q = query(
      tenantCollection(pharmacyId, STOCK_BATCHES_COLLECTION),
      where("isDeleted", "==", false),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading stock batches:", error);
    throw new Error(`Failed to load stock batches: ${error.message}`);
  }
};

export const createStockBatch = async (batchData, pharmacyId) => {
  try {
    const batchRef = doc(tenantCollection(pharmacyId, STOCK_BATCHES_COLLECTION));
    const medicineRef = tenantDoc(pharmacyId, MEDICINES_COLLECTION, batchData.medicineId);

    await runTransaction(db, async (transaction) => {
      const payload = {
        ...batchData,
        quantity: Number(batchData.quantity),
        costPrice: Number(batchData.costPrice),
        sellingPrice: Number(batchData.sellingPrice),
        status: batchData.quantity > 0 ? "In Stock" : "Out of Stock",
        pharmacyId,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      transaction.set(batchRef, payload);
      transaction.update(medicineRef, { totalStock: increment(Number(batchData.quantity)), updatedAt: serverTimestamp() });
    });
    return { id: batchRef.id, ...batchData };
  } catch (error) {
    console.error("Error creating stock batch:", error);
    throw new Error(`Failed to create stock batch: ${error.message}`);
  }
};

export const updateStockBatch = async (batchId, updates, pharmacyId) => {
  try {
    if (!pharmacyId) throw new Error("pharmacyId is required");
    const batchRef = tenantDoc(pharmacyId, STOCK_BATCHES_COLLECTION, batchId);
    await runTransaction(db, async (transaction) => {
      const batchSnap = await transaction.get(batchRef);
      if (!batchSnap.exists()) throw new Error("Batch not found");

      const oldData = batchSnap.data();
      const newQuantity = updates.quantity !== undefined ? Number(updates.quantity) : oldData.quantity;
      const quantityDiff = newQuantity - Number(oldData.quantity);

      const updatePayload = { ...updates, updatedAt: serverTimestamp() };
      if (updates.quantity !== undefined) {
        updatePayload.status = newQuantity > 0 ? "In Stock" : "Out of Stock";
      }
      transaction.update(batchRef, updatePayload);

      if (quantityDiff !== 0) {
        const medicineRef = tenantDoc(pharmacyId, MEDICINES_COLLECTION, oldData.medicineId);
        transaction.update(medicineRef, { totalStock: increment(quantityDiff), updatedAt: serverTimestamp() });
      }
    });
    return { id: batchId, ...updates };
  } catch (error) {
    console.error("Error updating stock batch:", error);
    throw new Error(`Failed to update stock batch: ${error.message}`);
  }
};

export const deleteStockBatch = async (batchId, pharmacyId) => {
  try {
    if (!pharmacyId) throw new Error("pharmacyId is required");
    const batchRef = tenantDoc(pharmacyId, STOCK_BATCHES_COLLECTION, batchId);
    await runTransaction(db, async (transaction) => {
      const batchSnap = await transaction.get(batchRef);
      if (!batchSnap.exists()) throw new Error("Batch not found");

      const data = batchSnap.data();
      if (data.isDeleted) return;

      transaction.update(batchRef, { isDeleted: true, deletedAt: serverTimestamp() });
      const medicineRef = tenantDoc(pharmacyId, MEDICINES_COLLECTION, data.medicineId);
      transaction.update(medicineRef, { totalStock: increment(-Number(data.quantity || 0)), updatedAt: serverTimestamp() });
    });
    return batchId;
  } catch (error) {
    console.error("Error deleting stock batch:", error);
    throw new Error(`Failed to delete stock batch: ${error.message}`);
  }
};

// export const getDashboardStockStats = async (pharmacyId, settings) => {
//     const batchesRef = collection(db, STOCK_BATCHES_COLLECTION);
//     const qBase = query(
//       batchesRef,
//       where("pharmacyId", "==", pharmacyId),
//       where("isDeleted", "==", false),
//     );
  
//     // 1. Total Inventory Stock (using getAggregateFromServer)
//     const totalStockAgg = await getAggregateFromServer(qBase, {
//       total: sum("quantity"),
//     });
  
//     // Total batches
//     const totalBatchesSnap = await getCountFromServer(qBase);
  
//     // 2. Out of stock
//     const outOfStockSnap = await getCountFromServer(
//       query(qBase, where("quantity", "==", 0)),
//     );
  
//     // 3. Low stock
//     const lowStockSnap = await getCountFromServer(
//       query(
//         qBase,
//         where("quantity", ">", 0),
//         where("quantity", "<=", Number(settings?.lowStockThreshold || 10)),
//       ),
//     );
  
//     // 4. Expired
//     const now = new Date();
//     now.setHours(0, 0, 0, 0);
//     const expiredSnap = await getCountFromServer(
//       query(qBase, where("expiry", "<", now)),
//     );
  
//     return {
//       inventoryStock: totalStockAgg.data().total || 0,
//       totalBatches: totalBatchesSnap.data().count || 0,
//       outOfStock: outOfStockSnap.data().count || 0,
//       lowStock: lowStockSnap.data().count || 0,
//       expired: expiredSnap.data().count || 0,
//     };
//   };

export const getDashboardStockStats = async (pharmacyId, settings) => {
  const batchesRef = tenantCollection(pharmacyId, STOCK_BATCHES_COLLECTION);
  const qBase = query(
    batchesRef,
    where("isDeleted", "==", false),
  );

  // 1. Total Inventory Stock (using getAggregateFromServer)
  const totalStockAgg = await getAggregateFromServer(qBase, {
    total: sum("quantity"),
  });

  // Total batches
  const totalBatchesSnap = await getCountFromServer(qBase);

  // 2. Out of stock
  const outOfStockSnap = await getCountFromServer(
    query(qBase, where("quantity", "==", 0)),
  );

  // 3. Low stock
  const lowStockSnap = await getCountFromServer(
    query(
      qBase,
      where("quantity", ">", 0),
      where("quantity", "<=", Number(settings?.lowStockThreshold || 10)),
    ),
  );

  // 4. Expired (FIXED)
  // We calculate this in JavaScript to perfectly match the timezone-safe 
  // YYYY-MM-DD string comparison logic used in your Expiration page.
  const allBatchesSnap = await getDocs(qBase);
  let expiredCount = 0;
  
  // Exact same helper logic from your Expiration page
  const toDateKey = (date) => {
    if (!date) return null;
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toISOString().split("T")[0];
  };
  
  const todayKey = toDateKey(new Date());

  allBatchesSnap.forEach((doc) => {
    const data = doc.data();
    if (data.expiry) {
      const expiryKey = toDateKey(data.expiry);
      if (expiryKey && expiryKey < todayKey) {
        expiredCount++;
      }
    }
  });

  return {
    inventoryStock: totalStockAgg.data().total || 0,
    totalBatches: totalBatchesSnap.data().count || 0,
    outOfStock: outOfStockSnap.data().count || 0,
    lowStock: lowStockSnap.data().count || 0,
    expired: expiredCount, // Now uses the JS calculated count!
  };
};




export const subscribeToStockBatches = (pharmacyId, callback) => {
  const q = query(
    tenantCollection(pharmacyId, STOCK_BATCHES_COLLECTION),
    where("isDeleted", "==", false),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const batches = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(batches);
    },
    (error) => {
      console.error("Error in stock batches subscription:", error);
    }
  );
};
