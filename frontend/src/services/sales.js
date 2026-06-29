import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { SALES_COLLECTION } from "./collections";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Sales service request failed");
  }
  return data;
};

export const createSale = async (sale, pharmacyId) => {
  try {
    const response = await fetch(`${API_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sale, pharmacyId }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error creating sale:", error);
    throw new Error(`Failed to create sale: ${error.message}`);
  }
};

export const getAllSales = async (pharmacyId) => {
  try {
    const url = new URL(`${API_URL}/sales`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString());
    return await handleResponse(response);
  } catch (error) {
    console.error("Error loading sales:", error);
    throw new Error(`Failed to load sales: ${error.message}`);
  }
};

export const getRecentSales = async (pharmacyId, limitCount = 50) => {
  try {
    const url = new URL(`${API_URL}/sales/recent`);
    url.searchParams.append("pharmacyId", pharmacyId);
    url.searchParams.append("limit", String(limitCount));

    const response = await fetch(url.toString());
    return await handleResponse(response);
  } catch (error) {
    console.error("Error loading recent sales:", error);
    throw new Error(`Failed to load recent sales: ${error.message}`);
  }
};

export const getSalesByDateRange = async (pharmacyId, start, end) => {
  try {
    const url = new URL(`${API_URL}/sales/range`);
    url.searchParams.append("pharmacyId", pharmacyId);
    url.searchParams.append("start", new Date(start).toISOString());
    url.searchParams.append("end", new Date(end).toISOString());

    const response = await fetch(url.toString());
    return await handleResponse(response);
  } catch (error) {
    console.error("Error loading sales by date range:", error);
    throw new Error(`Failed to load sales by date range: ${error.message}`);
  }
};

// Real-time subscriptions remain on the client via Firestore listeners.
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
