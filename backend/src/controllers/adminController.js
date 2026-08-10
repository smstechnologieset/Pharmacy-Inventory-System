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

// ─── CREATE USER ──────────────────────────────────────────────────────────────
export const createUser = asyncHandler(async (req, res) => {
    const { email, password, name, role, pharmacyId } = req.body;

    if (!email || !password || !name || !role) {
        return res.status(400).json({ error: "Email, password, name, and role are required" });
    }

    const validRoles = ["admin", "pharmacist", "cashier", "superadmin"];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    // Create Firebase Auth user
    let userRecord;
    try {
        userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name
        });
    } catch (error) {
        if (error.code === "auth/email-already-exists") {
            return res.status(409).json({ error: "A user with this email already exists" });
        }
        throw error;
    }

    // Create Firestore user document
    const userData = {
        uid: userRecord.uid,
        email,
        name,
        role,
        status: "Active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: req.user.uid
    };

    if (pharmacyId) {
        userData.pharmacyId = pharmacyId;
    }

    await db.collection("users").doc(userRecord.uid).set(userData);

    // Set custom claims for role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role, ...(pharmacyId && { pharmacyId }) });

    // Audit log
    await db.collection("auditLogs").add({
        actor: req.user.email,
        action: `Created user account (${role})`,
        target: userRecord.uid,
        details: `Created ${name} (${email}) with role ${role}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, id: userRecord.uid });
});

// ─── UPDATE USER ROLE ─────────────────────────────────────────────────────────
export const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["admin", "pharmacist", "cashier", "superadmin"];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
    }

    await db.collection("users").doc(userId).update({
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update custom claims
    const existingClaims = (await admin.auth().getUser(userId)).customClaims || {};
    await admin.auth().setCustomUserClaims(userId, { ...existingClaims, role });

    await db.collection("auditLogs").add({
        actor: req.user.email,
        action: `Changed user role to ${role}`,
        target: userId,
        details: `${userDoc.data().email} role changed to ${role}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
});

// ─── UPDATE USER STATUS ───────────────────────────────────────────────────────
export const updateUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ["Active", "Suspended", "Pending"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
    }

    await db.collection("users").doc(userId).update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If suspending, disable the auth account; if activating, enable it
    if (status === "Suspended") {
        await admin.auth().updateUser(userId, { disabled: true });
    } else if (status === "Active") {
        await admin.auth().updateUser(userId, { disabled: false });
    }

    await db.collection("auditLogs").add({
        actor: req.user.email,
        action: `Updated user status to ${status}`,
        target: userId,
        details: `${userDoc.data().email} status changed to ${status}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
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

export const createFeatureFlag = asyncHandler(async (req, res) => {
    const { name, description, enabled } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Feature flag name is required" });
    }

    const ref = await db.collection("featureFlags").add({
        name,
        description: description || "",
        enabled: enabled ?? false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: req.user.uid
    });

    await db.collection("auditLogs").add({
        actor: req.user.email,
        action: "Created feature flag",
        target: ref.id,
        details: `Created flag: ${name}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, id: ref.id });
});

export const deleteFeatureFlag = asyncHandler(async (req, res) => {
    const { flagId } = req.params;

    const docRef = db.collection("featureFlags").doc(flagId);
    const doc = await docRef.get();
    if (!doc.exists) {
        return res.status(404).json({ error: "Feature flag not found" });
    }

    await docRef.delete();

    await db.collection("auditLogs").add({
        actor: req.user.email,
        action: "Deleted feature flag",
        target: flagId,
        details: `Deleted flag: ${doc.data().name}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
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
    const { title, message, target, scheduledAt } = req.body;

    if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
    }

    const announcementData = {
        title,
        message,
        target: target || "All Pharmacies",
        status: scheduledAt ? "Scheduled" : "Sent",
        createdBy: req.user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (scheduledAt) {
        announcementData.scheduledAt = new Date(scheduledAt);
    }

    const ref = await db.collection("announcements").add(announcementData);
    res.json({ success: true, id: ref.id });
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
    const { announcementId } = req.params;
    const { title, message, target, scheduledAt, status } = req.body;

    const docRef = db.collection("announcements").doc(announcementId);
    const doc = await docRef.get();
    if (!doc.exists) {
        return res.status(404).json({ error: "Announcement not found" });
    }

    const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (target !== undefined) updateData.target = target;
    if (status !== undefined) updateData.status = status;
    if (scheduledAt !== undefined) {
        updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : admin.firestore.FieldValue.delete();
        updateData.status = scheduledAt ? "Scheduled" : "Sent";
    }

    await docRef.update(updateData);

    await db.collection("auditLogs").add({
        actor: req.user.email,
        action: "Updated announcement",
        target: announcementId,
        details: title || "Announcement updated",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
    const { announcementId } = req.params;

    const docRef = db.collection("announcements").doc(announcementId);
    const doc = await docRef.get();
    if (!doc.exists) {
        return res.status(404).json({ error: "Announcement not found" });
    }

    await docRef.delete();

    await db.collection("auditLogs").add({
        actor: req.user.email,
        action: "Deleted announcement",
        target: announcementId,
        details: doc.data().title || "Announcement deleted",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
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

export const deleteSubscriptionTier = asyncHandler(async (req, res) => {
    const { tierId } = req.params;

    const doc = await db.collection("platformSettings").doc("subscriptionTiers").get();
    if (!doc.exists) {
        return res.status(404).json({ error: "Subscription tiers not found" });
    }

    const tiers = doc.data();
    if (!tiers[tierId]) {
        return res.status(404).json({ error: `Tier '${tierId}' not found` });
    }

    // Check if any pharmacy is on this tier
    const pharmaciesOnTier = await db.collection("pharmacies")
        .where("subscription.tier", "==", tierId)
        .limit(1)
        .get();

    if (!pharmaciesOnTier.empty) {
        return res.status(409).json({
            error: `Cannot delete tier '${tierId}' — there are pharmacies currently subscribed to it. Move them to a different tier first.`
        });
    }

    // Use FieldValue.delete() to remove the key
    await db.collection("platformSettings").doc("subscriptionTiers").update({
        [tierId]: admin.firestore.FieldValue.delete()
    });

    await db.collection("auditLogs").add({
        actor: req.user.email,
        action: "Deleted subscription tier",
        target: tierId,
        details: `Deleted tier: ${tiers[tierId].name}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
});