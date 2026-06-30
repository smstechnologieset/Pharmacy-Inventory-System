import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import { TIER_LIMITS } from "../config/subscriptionConfig.js";

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
    // 🔒 SECURITY: Get pharmacyId from verified token
    const pharmacyId = req.tenant.id;
    const { sale } = req.body; // Removed pharmacyId from body requirement

    if (!sale) {
      return res.status(400).json({ error: "Sale data is required" });
    }

    // 🛑 QUOTA CHECK: Verify they haven't hit their daily transaction limit
    const tier = req.tenant.subscription.tier;
    const limits = TIER_LIMITS[tier];
    const dailyTx = req.tenant.usageMetrics?.dailyTransactionsToday || 0;

    if (dailyTx >= limits.dailyTransactions) {
      return res.status(402).json({
        error: "Daily transaction limit reached",
        message: `Your plan allows ${limits.dailyTransactions} transactions per day. Please upgrade for unlimited sales.`,
      });
    }

    const payload = {
      ...sale,
      quantity: Number(sale.quantity),
      amount: Number(sale.amount),
      pharmacyId,
      createdBy: req.user.uid, // Track who made the sale
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = getFirestore();
    const saleRef = await tenantCollection(
      db,
      pharmacyId,
      SALES_COLLECTION,
    ).add(payload);

    // 📈 INCREMENT QUOTA: Atomically increase daily transaction count
    await db
      .collection("pharmacies")
      .doc(pharmacyId)
      .update({
        "usageMetrics.dailyTransactionsToday":
          admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.status(201).json({ id: saleRef.id, ...payload });
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const db = getFirestore();
    let salesQuery;

    // 🔒 SECURITY: Super admins can see all, tenants only see their own
    if (req.user.role === "super_admin") {
      salesQuery = db.collectionGroup(SALES_COLLECTION);
    } else {
      const pharmacyId = req.tenant.id;
      salesQuery = tenantCollection(db, pharmacyId, SALES_COLLECTION);
    }

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
    // 🔒 SECURITY: Ignore pharmacyId from query, use token
    const pharmacyId = req.tenant.id;
    const limitCount = Number(req.query.limit) || 50;
    const db = getFirestore();

    const snapshot = await tenantCollection(db, pharmacyId, SALES_COLLECTION)
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
    // 🔒 SECURITY: Ignore pharmacyId from query, use token
    const pharmacyId = req.tenant.id;
    const { start, end } = req.query;

    if (!start || !end) {
      return res
        .status(400)
        .json({ error: "start and end dates are required" });
    }

    const db = getFirestore();
    const snapshot = await tenantCollection(db, pharmacyId, SALES_COLLECTION)
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
