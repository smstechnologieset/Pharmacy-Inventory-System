import admin from "firebase-admin";
import { getFirestore } from "./config/firebase.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { TIER_LIMITS, TIER_PRICING, SUBSCRIPTION_TIERS } from "./config/subscriptionConfig.js";

const db = getFirestore();

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  // Run all top-level queries in parallel
  const [pharmaciesSnap, usersSnap] = await Promise.all([
    db.collection("pharmacies").get(),
    db.collection("users").where("role", "!=", "superadmin").get(),
  ]);

  let totalRevenue = 0;
  let activeCount = 0;
  let pendingCount = 0;
  let suspendedCount = 0;
  const planCounts = {};

  pharmaciesSnap.docs.forEach((doc) => {
    const data = doc.data();
    const status = data.status || "pending";
    const tier = data.subscription?.tier || "starter";

    if (status === "active") activeCount++;
    else if (status === "pending") pendingCount++;
    else if (status === "suspended") suspendedCount++;

    planCounts[tier] = (planCounts[tier] || 0) + 1;

    // Sum MRR from active subscriptions
    if (status === "active" && data.subscription) {
      const cycle = data.subscription.billingCycle || "monthly";
      const pricing = TIER_PRICING[tier];
      if (pricing && pricing[cycle]) {
        totalRevenue += pricing[cycle].amount;
      }
    }
  });

  res.json({
    totalPharmacies: pharmaciesSnap.size,
    activePharmacies: activeCount,
    pendingApprovals: pendingCount,
    suspendedPharmacies: suspendedCount,
    mrr: totalRevenue,
    totalUsers: usersSnap.size,
    planDistribution: planCounts,  });
});

// ─── LIST ALL PHARMACIES ──────────────────────────────────────────────────────
export const listPharmacies = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  let query = db.collection("pharmacies").orderBy("createdAt", "desc");

  if (status && status !== "All") {
    query = query.where("status", "==", status);
  }

  const snapshot = await query.limit(Number(limit)).get();

  const pharmacies = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Client-side search filter (Firestore doesn't support text search natively)
  const filtered = search
    ? pharmacies.filter(
        (p) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.adminUid?.toLowerCase().includes(search.toLowerCase())
      )
    : pharmacies;

  res.json({ pharmacies: filtered, total: filtered.length });
});

// ─── GET SINGLE PHARMACY DETAIL ───────────────────────────────────────────────
export const getPharmacyDetail = asyncHandler(async (req, res) => {
  const { pharmacyId } = req.params;

  const [pharmacyDoc, membersSnap, statsDoc] = await Promise.all([
    db.collection("pharmacies").doc(pharmacyId).get(),
    db.collection("pharmacies").doc(pharmacyId).collection("members").get(),
    db.collection("pharmacies").doc(pharmacyId).collection("stats").doc("pharmacy").get(),
  ]);

  if (!pharmacyDoc.exists) {
    return res.status(404).json({ error: "Pharmacy not found" });
  }

  res.json({
    id: pharmacyDoc.id,
    ...pharmacyDoc.data(),
    members: membersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),    stats: statsDoc.exists ? statsDoc.data() : null,
  });
});

// ─── UPDATE PHARMACY STATUS ───────────────────────────────────────────────────
export const updatePharmacyStatus = asyncHandler(async (req, res) => {
  const { pharmacyId } = req.params;
  const { status, reason } = req.body;

  if (!["active", "suspended", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value
