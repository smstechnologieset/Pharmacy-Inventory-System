import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import { TIER_LIMITS } from "../config/subscriptionConfig.js"; // Import limits

export const createStaff = async (req, res) => {
  try {
    // 🔒 SECURITY: Get pharmacyId from verified token, NOT req.body
    const pharmacyId = req.tenant.id;
    const { name, email, role, pharmacyName, createdBy } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // 🛑 QUOTA CHECK: Verify they haven't hit their user limit
    const tier = req.tenant.subscription.tier;
    const limits = TIER_LIMITS[tier];
    const currentUsers = req.tenant.usageMetrics?.currentUserCount || 0;

    if (currentUsers >= limits.maxUsers) {
      return res.status(402).json({
        error: "User limit reached",
        message: `Your plan allows a maximum of ${limits.maxUsers} users. Please upgrade to add more staff.`,
      });
    }

    // 1. Generate a secure random password
    const username = email.split("@")[0];
    const digits = Math.floor(10000 + Math.random() * 90000);
    const password = `${username}@${digits}`;

    // 2. Create user with Firebase Admin SDK
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true,
    });

    const uid = userRecord.uid;

    // 3. Save profile to Firestore
    const db = getFirestore();
    const profile = {
      uid,
      email,
      name,
      role: role || "staff",
      pharmacyId: pharmacyId, // Use verified ID
      pharmacyName: pharmacyName || "",
      createdBy: createdBy || req.user.uid, // Track who created them
      avatar: `https://i.pravatar.cc/150?u=${uid}`,
      status: "Active",
      isDeleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(uid).set(profile);
    await db
      .collection("pharmacies")
      .doc(pharmacyId)
      .collection("members")
      .doc(uid)
      .set(profile);

    // 📈 INCREMENT QUOTA: Atomically increase the user count for this pharmacy
    await db
      .collection("pharmacies")
      .doc(pharmacyId)
      .update({
        "usageMetrics.currentUserCount":
          admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // 4. Return the credentials to the frontend
    res.status(201).json({ success: true, uid, password });
  } catch (error) {
    console.error("Error creating staff:", error);
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({ error: "auth/email-already-in-use" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Disable staff (soft delete)
export const disableStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    // Disable in Firebase Auth
    try {
      await admin.auth().updateUser(userId, { disabled: true });
    } catch (authError) {
      if (authError.code !== "auth/user-not-found")
        console.error("Auth disable error:", authError);
    }

    // Update Firestore
    const db = getFirestore();
    const profileSnap = await db.collection("users").doc(userId).get();
    const pharmacyId = profileSnap.data()?.pharmacyId;
    // 🔒 SECURITY: Ensure the user belongs to the current tenant (unless super admin)
    if (req.user.role !== "super_admin" && pharmacyId !== req.tenant.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: User does not belong to your pharmacy" });
    }

    const updates = {
      status: "Disabled",
      isDeleted: true,
      disabledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(userId).update(updates);
    if (pharmacyId) {
      await db
        .collection("pharmacies")
        .doc(pharmacyId)
        .collection("members")
        .doc(userId)
        .update(updates);
    }

    // Note: We DO NOT decrement currentUserCount here. Disabled users still take up a "seat" in SaaS.
    res.json({ success: true, message: "Staff member disabled successfully" });
  } catch (error) {
    console.error("Error disabling staff:", error);
    res.status(500).json({ error: error.message });
  }
};

// Re-enable staff
export const enableStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    try {
      await admin.auth().updateUser(userId, { disabled: false });
    } catch (authError) {
      if (authError.code !== "auth/user-not-found")
        console.error("Auth enable error:", authError);
    }

    const db = getFirestore();
    const profileSnap = await db.collection("users").doc(userId).get();
    const pharmacyId = profileSnap.data()?.pharmacyId;

    if (req.user.role !== "super_admin" && pharmacyId !== req.tenant.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updates = {
      status: "Active",
      isDeleted: false,
      disabledAt: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(userId).update(updates);
    if (pharmacyId) {
      await db
        .collection("pharmacies")
        .doc(pharmacyId)
        .collection("members")
        .doc(userId)
        .update(updates);
    }

    res.json({
      success: true,
      message: "Staff member re-enabled successfully",
    });
  } catch (error) {
    console.error("Error enabling staff:", error);
    res.status(500).json({ error: error.message });
  }
};

// Hard delete staff (frees up a seat)
export const hardDeleteStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    try {
      await admin.auth().deleteUser(userId);
    } catch (authError) {
      if (authError.code !== "auth/user-not-found")
        console.error("Auth delete error:", authError);
    }

    const db = getFirestore();
    const profileSnap = await db.collection("users").doc(userId).get();
    const pharmacyId = profileSnap.data()?.pharmacyId;

    if (req.user.role !== "super_admin" && pharmacyId !== req.tenant.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.collection("users").doc(userId).delete();
    if (pharmacyId) {
      await db
        .collection("pharmacies")
        .doc(pharmacyId)
        .collection("members")
        .doc(userId)
        .delete();

      // 📉 DECREMENT QUOTA: Free up the seat since the user is permanently gone
      await db
        .collection("pharmacies")
        .doc(pharmacyId)
        .update({
          "usageMetrics.currentUserCount":
            admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    res.json({ success: true, message: "Staff member permanently deleted" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, role, status } = req.body;
    
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const db = getFirestore();
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const userData = userDoc.data();
    const pharmacyId = userData.pharmacyId;

    // 🔒 SECURITY: Ensure the user belongs to the current tenant
    if (req.user.role !== 'super_admin' && pharmacyId !== req.tenant.id) {
        return res.status(403).json({ error: "Forbidden: User does not belong to your pharmacy" });
    }

    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;

    // 1. Update main users collection
    await db.collection("users").doc(userId).update(updates);
    
    // 2. Update tenant subcollection
    if (pharmacyId) {
      await db.collection("pharmacies").doc(pharmacyId).collection("members").doc(userId).update(updates);
    }

    // 🚨 CRITICAL: If the role changed, update Firebase Custom Claims!
    if (role !== undefined && role !== userData.role) {
      await admin.auth().setCustomUserClaims(userId, {
        pharmacyId: pharmacyId,
        role: role
      });
    }

    res.json({ success: true, message: "Staff updated successfully" });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ error: error.message });
  }
};
