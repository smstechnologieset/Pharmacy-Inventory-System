import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";

const SALES_COLLECTION = "sales";

const serializeSale = (docRef) => ({ id: docRef.id, ...docRef.data() });

const tenantCollection = (db, pharmacyId, collectionName) =>
  db.collection("pharmacies").doc(pharmacyId).collection(collectionName);

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  return new Date(value).getTime();
};

export const createSale = async (req, res) => {
  try {
    const { sale, pharmacyId } = req.body;
    if (!sale || !pharmacyId) {
      return res
        .status(400)
        .json({ error: "Sale data and pharmacyId are required" });
    }

    const payload = {
      ...sale,
      quantity: Number(sale.quantity),
      amount: Number(sale.amount),
      pharmacyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = getFirestore();
    const saleRef = await tenantCollection(db, pharmacyId, SALES_COLLECTION).add(
      payload,
    );
    res.status(201).json({ id: saleRef.id, ...payload });
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    const db = getFirestore();

    const salesQuery = pharmacyId
      ? tenantCollection(db, pharmacyId, SALES_COLLECTION)
      : db.collectionGroup(SALES_COLLECTION);

    const snapshot = await salesQuery.get();
    const sales = snapshot.docs
      .map(serializeSale)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

    res.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getRecentSales = async (req, res) => {
  try {
    const { pharmacyId, limit } = req.query;
    if (!pharmacyId) {
      return res.status(400).json({ error: "pharmacyId is required" });
    }

    const limitCount = Number(limit) || 50;
    const db = getFirestore();

    const snapshot = await db
      .collection("pharmacies")
      .doc(pharmacyId)
      .collection(SALES_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();

    res.json(snapshot.docs.map(serializeSale));
  } catch (error) {
    console.error("Error fetching recent sales:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getSalesByDateRange = async (req, res) => {
  try {
    const { pharmacyId, start, end } = req.query;
    if (!pharmacyId || !start || !end) {
      return res
        .status(400)
        .json({ error: "pharmacyId, start and end are required" });
    }

    const db = getFirestore();
    const snapshot = await db
      .collection("pharmacies")
      .doc(pharmacyId)
      .collection(SALES_COLLECTION)
      .where("createdAt", ">=", new Date(start))
      .where("createdAt", "<=", new Date(end))
      .orderBy("createdAt", "desc")
      .get();

    res.json(snapshot.docs.map(serializeSale));
  } catch (error) {
    console.error("Error fetching sales by date range:", error);
    res.status(500).json({ error: error.message });
  }
};
