import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    TIER_LIMITS,
    TIER_PRICING,
    SUBSCRIPTION_TIERS
} from "../config/subscriptionConfig.js";

// ✅ Safe top-level initialization using the lazy singleton
const db = getFirestore();

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
    // ✅ FIX: Fetch all users and filter in memory to avoid "!=" composite index issues
    const [pharmaciesSnap, usersSnap] = await Promise.all([
        db.collection("pharmacies").get(),
        db.collection("users").get() 
    ]);

    // Filter out superadmins in memory
    const totalUsers = usersSnap.docs.filter(doc => doc.data().role !== "superadmin").length;

    let totalRevenue = 0;
    let activeCount = 0;
    let pendingCount = 0;
    let suspendedCount = 0;
    const planCounts = {};

    pharmaciesSnap.docs.forEach(doc => {
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
        totalUsers: totalUsers, // ✅ Use filtered count
        planDistribution: planCounts
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

    const pharmacies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    const filtered = search
        ? pharmacies.filter(
              p =>
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
        db.collection("pharmacies").doc(pharmacyId).collection("stats").doc("pharmacy").get()
    ]);

    if (!pharmacyDoc.exists) {        return res.status(404).json({ error: "Pharmacy not found" });
    }

    res.json({
        id: pharmacyDoc.id,
        ...pharmacyDoc.data(),
        members: membersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        stats: statsDoc.exists ? statsDoc.data() : null
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
        ...(reason && { statusReason: reason })
    });

    // Optional: Log to audit collection
    await db.collection("auditLogs").add({
        actor: req.user.email || "System",
        action: `Updated pharmacy status to ${status}`,
        target: pharmacyId,
        details: reason || "No reason provided",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
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

    let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (search) {
        const q = search.toLowerCase();
        users = users.filter(
            u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
        );
    }

    res.json({ users });
});

// ─── VERIFICATION QUEUE ───────────────────────────────────────────────────────
export const getVerificationQueue = asyncHandler(async (req, res) => {
    // ✅ FIX: Fetch all pending, then sort in memory to avoid composite index requirement
    const snapshot = await db
        .collection("pharmacies")
        .where("status", "==", "pending")
        .get();

    const queue = snapshot.docs
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        .sort((a, b) => {
            // Handle Firestore Timestamp objects (toMillis) or Date objects (getTime)
            const timeA = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
            return timeA - timeB; // Ascending order (oldest first)
        });

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

    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
    const flags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ flags });
});

export const toggleFeatureFlag = asyncHandler(async (req, res) => {
    const { flagId } = req.params;
    const { enabled } = req.body;

    await db.collection("featureFlags").doc(flagId).update({
        enabled,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
});

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export const getAnnouncements = asyncHandler(async (req, res) => {
    const snapshot = await db.collection("announcements").orderBy("createdAt", "desc").get();
    const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ announcements });
});
export const createAnnouncement = asyncHandler(async (req, res) => {
    const ref = await db.collection("announcements").add({
        ...req.body,
        createdBy: req.user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true, id: ref.id });
});

// ─── EXPORT SUBSCRIPTION CONFIG (for frontend) ───────────────────────────────
export const getSubscriptionConfig = asyncHandler(async (req, res) => {
    res.json({ tiers: TIER_LIMITS, pricing: TIER_PRICING });
});

// ─── SUBSCRIPTION TIERS MANAGEMENT ────────────────────────────────────────────
export const getSubscriptionTiers = asyncHandler(async (req, res) => {
    // ✅ FIX: Removed `const db = getDb();` - uses top-level `db`
    const doc = await db.collection("platformSettings").doc("subscriptionTiers").get();

    if (!doc.exists) {
        const defaultTiers = {
            starter: {
                name: "Starter",
                description: "Perfect for single-branch community pharmacies",
                limits: { maxSkus: 500, maxUsers: 3, maxBranches: 1, dailyTransactions: 50 },
                pricing: { monthly: 1500, yearly: 15000 },
                features: ["Basic Inventory", "Sales Tracking", "Low Stock Alerts", "Email Support"],
                enabled: true
            },
            growth: {
                name: "Growth",
                description: "For growing pharmacies with multiple staff",
                limits: { maxSkus: 2000, maxUsers: 5, maxBranches: 2, dailyTransactions: 200 },
                pricing: { monthly: 3000, yearly: 28000 },
                features: ["Everything in Starter", "Multi-branch", "Advanced Reports", "Priority Support", "API Access"],
                enabled: true
            },
            business: {
                name: "Business",
                description: "For chains and wholesalers who need unlimited scale",
                limits: { maxSkus: -1, maxUsers: -1, maxBranches: -1, dailyTransactions: -1 },
                pricing: { monthly: 5000, yearly: 42000 },
                features: ["Everything in Growth", "AI Forecasting", "Custom Integrations", "Dedicated Account Manager", "SLA Guarantee"],
                enabled: true
            }
        };
        return res.json({ tiers: defaultTiers, source: "default" });
    }

    res.json({ tiers: doc.data(), source: "firestore" });});

export const updateSubscriptionTiers = asyncHandler(async (req, res) => {
    // ✅ FIX: Removed `const db = getDb();` - uses top-level `db`
    const { tiers } = req.body;

    if (!tiers || typeof tiers !== "object") {
        return res.status(400).json({ error: "Invalid tiers data" });
    }

    await db.collection("platformSettings").doc("subscriptionTiers").set(tiers, { merge: true });

    // Log to audit
    await db.collection("auditLogs").add({
        actor: req.user.email,
        action: "Updated subscription tiers",
        target: "platformSettings",
        details: `Modified ${Object.keys(tiers).length} tier(s)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: "Subscription tiers updated" });
});