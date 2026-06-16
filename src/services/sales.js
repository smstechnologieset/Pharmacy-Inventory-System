import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { SALES_COLLECTION } from "./collections";

export const createSale = async (sale, pharmacyId) => {
  try {
    const saleRef = await addDoc(collection(db, SALES_COLLECTION), {
      ...sale,
      quantity: Number(sale.quantity),
      amount: Number(sale.amount),
      pharmacyId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: saleRef.id, ...sale };
  } catch (error) {
    console.error("Error creating sale:", error);
    throw new Error(`Failed to create sale: ${error.message}`);
  }
};

export const getAllSales = async (pharmacyId) => {
  try {
    const salesQuery = pharmacyId
      ? query(collection(db, SALES_COLLECTION), where("pharmacyId", "==", pharmacyId))
      : query(collection(db, SALES_COLLECTION));
    const snapshot = await getDocs(salesQuery);
    const data = snapshot.docs.map((docRef) => ({ id: docRef.id, ...docRef.data() }));

    return data.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error loading sales:", error);
    throw new Error(`Failed to load sales: ${error.message}`);
  }
};

export const subscribeToDailySalesStats = (pharmacyId, callback) => {
    const q = query(
      collection(db, "dailySalesStats"),
      where("pharmacyId", "==", pharmacyId),
      orderBy("date", "asc"),
    );
    return onSnapshot(q, (snapshot) => {
      const stats = snapshot.docs.map((doc) => doc.data());
      callback(stats);
    });
  };

  export const subscribeToRecentSales = (pharmacyId, limitCount, callback) => {
      const q = query(
        collection(db, SALES_COLLECTION),
        where("pharmacyId", "==", pharmacyId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      );
      return onSnapshot(q, (snapshot) => {
        const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        callback(sales);
      });
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
