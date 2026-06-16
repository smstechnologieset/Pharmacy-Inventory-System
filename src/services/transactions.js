import {
  doc,

  collection,
  serverTimestamp,
  runTransaction,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { SALES_COLLECTION, MEDICINES_COLLECTION } from "./collections";

export const processCheckoutTransaction = async (cart, paymentMethod, userId, pharmacyId) => {
  const saleDocRef = doc(collection(db, SALES_COLLECTION));
  const counterDocRef = doc(db, "counters", `${pharmacyId}_invoiceNumber`);

  const result = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterDocRef);
    const batchRefs = cart.map((item) => doc(db, "stockBatches", item.batchId));
    const batchSnaps = await Promise.all(batchRefs.map((ref) => transaction.get(ref)));
    const medicineRefs = cart.map((item) => doc(db, MEDICINES_COLLECTION, item.medicineId));

    let nextInvoice = 1001;
    if (counterSnap.exists()) nextInvoice = (counterSnap.data().sequence || 1000) + 1;

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const batchSnap = batchSnaps[i];
      if (!batchSnap.exists()) throw new Error(`Batch ${item.batchNo} no longer exists.`);
      const currentQty = batchSnap.data().quantity || 0;
      if (currentQty < item.quantity) throw new Error(`Insufficient stock for ${item.name} (Batch ${item.batchNo}). Only ${currentQty} left.`);
    }

    transaction.set(counterDocRef, { sequence: nextInvoice, pharmacyId, updatedAt: serverTimestamp() });

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const batchRef = batchRefs[i];
      const medicineRef = medicineRefs[i];
      const currentQty = batchSnaps[i].data().quantity || 0;

      transaction.update(batchRef, {
        quantity: currentQty - item.quantity,
        status: currentQty - item.quantity === 0 ? "Out of Stock" : "In Stock",
        updatedAt: serverTimestamp(),
      });
      transaction.update(medicineRef, { totalStock: increment(-item.quantity), updatedAt: serverTimestamp() });
    }

    const now = new Date();
    const totalSale = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const salePayload = {
      invoiceNumber: `INV-${nextInvoice}`,
      date: now.toLocaleDateString(),
      createdAt: serverTimestamp(),
      status: "Completed",
      paymentMethod: paymentMethod,
      pharmacyId,
      total: totalSale,
      items: cart.map((i) => ({
        batchId: i.batchId, medicineId: i.medicineId, name: i.name, batchNo: i.batchNo,
        quantity: i.quantity, price: i.price, costPrice: i.costPrice || 0, total: i.price * i.quantity,
      })),
      performedBy: userId || "Unknown",
    };
    transaction.set(saleDocRef, salePayload);

    const pharmacyStatsRef = doc(db, "pharmacyStats", pharmacyId);
    transaction.set(pharmacyStatsRef, { totalRevenue: increment(totalSale), totalSalesCount: increment(1), updatedAt: serverTimestamp(), pharmacyId }, { merge: true });

    const dateStr = now.toISOString().slice(0, 10);
    const dailySalesStatsRef = doc(db, "dailySalesStats", `${pharmacyId}_${dateStr}`);
    transaction.set(dailySalesStatsRef, { revenue: increment(totalSale), salesCount: increment(1), date: dateStr, pharmacyId, updatedAt: serverTimestamp() }, { merge: true });

    return { saleId: saleDocRef.id, invoiceNumber: `INV-${nextInvoice}`, salePayload };
  });
  return result;
};

export const processRefundTransaction = async (saleId, saleItems, userId) => {
  const saleDocRef = doc(db, SALES_COLLECTION, saleId);

  await runTransaction(db, async (transaction) => {
    const saleSnap = await transaction.get(saleDocRef);
    if (!saleSnap.exists()) throw new Error("Sale record not found.");
    if (saleSnap.data().status === "Refunded") throw new Error("This sale has already been refunded.");

    const batchRefs = saleItems.map((item) => doc(db, "stockBatches", item.batchId));
    const batchSnaps = await Promise.all(batchRefs.map((ref) => transaction.get(ref)));
    const medicineRefs = saleItems.map((item) => doc(db, MEDICINES_COLLECTION, item.medicineId));

    for (let i = 0; i < saleItems.length; i++) {
      const item = saleItems[i];
      if (!batchSnaps[i].exists()) throw new Error(`Batch ${item.batchNo} was deleted from the system. Cannot restore stock.`);
      const currentQty = batchSnaps[i].data().quantity || 0;
      
      transaction.update(batchRefs[i], { quantity: currentQty + item.quantity, status: "In Stock", updatedAt: serverTimestamp() });
      transaction.update(medicineRefs[i], { totalStock: increment(item.quantity), updatedAt: serverTimestamp() });
    }

    transaction.update(saleDocRef, { status: "Refunded", refundedAt: serverTimestamp(), refundedBy: userId || "Unknown" });

    const pharmacyId = saleSnap.data().pharmacyId;
    const totalSale = saleSnap.data().total || 0;
    let dateStr;
    const saleDate = saleSnap.data().createdAt?.toDate ? saleSnap.data().createdAt.toDate() : new Date();
    dateStr = !isNaN(saleDate) ? saleDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    if (pharmacyId) {
      const pharmacyStatsRef = doc(db, "pharmacyStats", pharmacyId);
      transaction.set(pharmacyStatsRef, { totalRevenue: increment(-totalSale), totalSalesCount: increment(-1), updatedAt: serverTimestamp() }, { merge: true });

      const dailySalesStatsRef = doc(db, "dailySalesStats", `${pharmacyId}_${dateStr}`);
      transaction.set(dailySalesStatsRef, { revenue: increment(-totalSale), salesCount: increment(-1), updatedAt: serverTimestamp() }, { merge: true });
    }
  });
  return true;
};
