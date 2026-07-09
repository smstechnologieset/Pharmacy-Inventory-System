import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { TIER_LIMITS, TIER_PRICING, SUBSCRIPTION_TIERS } from "../config/subscriptionConfig.js";

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
    planDistribution: planCounts,
  });
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
    members: membersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    stats: statsDoc.exists ? statsDoc.data() : null,
  });
});

// ─── UPDATE PHARMACY STATUS ───────────────────────────────────────────────────
export const updatePharmacyStatus = asyncHandler(async (req, res) => {
  const { pharmacyId } = req.params;
  const { status, reason } = req.body;

  if (!["active", "suspended", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  await db.collection("pharmacies").doc(pharmacyId).update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(reason && { statusReason: reason }),
  });

  res.json({ success: true, message: `Pharmacy ${status} successfully` });
});

// ─── LIST ALL USERS ───────────────────────────────────────────────────────────
export const listUsers = asyncHandler(async (req, res) => {
  const { search, limit = 50 } = req.query;

  const snapshot = await db
    .collection("users")
    .orderBy("createdAt", "desc")
    .limit(Number(limit))
    .get();

  let users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }

  res.json({ users });
});

// ─── VERIFICATION QUEUE ───────────────────────────────────────────────────────
export const getVerificationQueue = asyncHandler(async (req, res) => {
  const snapshot = await db
    .collection("pharmacies")
    .where("status", "==", "pending")
    .orderBy("createdAt", "asc")
    .get();

  const queue = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json({ queue });
});

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const snapshot = await db
    .collection("auditLogs")
    .orderBy("timestamp", "desc")
    .limit(Number(limit))
    .get();

  const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json({ logs });
});

// ─── PAYMENTS OVERVIEW ────────────────────────────────────────────────────────
export const getPaymentsOverview = asyncHandler(async (req, res) => {
  const { status } = req.query;

  let query = db.collection("payments").orderBy("createdAt", "desc").limit(100);

  if (status && status !== "All") {
    query = query.where("status", "==", status);
  }

  const snapshot = await query.get();
  const payments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.json({ payments });
});

// ─── PLATFORM SETTINGS ────────────────────────────────────────────────────────
export const getPlatformSettings = asyncHandler(async (req, res) => {
  const doc = await db.collection("platformSettings").doc("global").get();
  res.json(doc.exists ? doc.data() : {});
});

export const updatePlatformSettings = asyncHandler(async (req, res) => {
  await db.collection("platformSettings").doc("global").set(req.body, { merge: true });
  res.json({ success: true });
});

// ─── FEATURE FLAGS ────────────────────────────────────────────────────────────
export const getFeatureFlags = asyncHandler(async (req, res) => {
  const snapshot = await db.collection("featureFlags").get();
  const flags = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json({ flags });
});

export const toggleFeatureFlag = asyncHandler(async (req, res) => {
  const { flagId } = req.params;
  const { enabled } = req.body;

  await db.collection("featureFlags").doc(flagId).update({
    enabled,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.json({ success: true });
});

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export const getAnnouncements = asyncHandler(async (req, res) => {
  const snapshot = await db
    .collection("announcements")
    .orderBy("createdAt", "desc")
    .get();
  const announcements = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json({ announcements });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const ref = await db.collection("announcements").add({
    ...req.body,
    createdBy: req.user.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  res.json({ success: true, id: ref.id });
});

// ─── EXPORT SUBSCRIPTION CONFIG (for frontend) ───────────────────────────────
export const getSubscriptionConfig = asyncHandler(async (req, res) => {
  res.json({ tiers: TIER_LIMITS, pricing: TIER_PRICING });
});
