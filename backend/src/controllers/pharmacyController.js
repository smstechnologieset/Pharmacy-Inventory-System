import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import { SUBSCRIPTION_TIERS } from "../config/subscriptionConfig.js";

const PHARMACIES_COLLECTION = "pharmacies";
const USERS_COLLECTION = "users";

const serializePharmacy = (docRef) => ({ id: docRef.id, ...docRef.data() });

export const getAllPharmacies = async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(PHARMACIES_COLLECTION).get();
    res.json(snapshot.docs.map(serializePharmacy));
  } catch (error) {
    console.error("Error fetching pharmacies:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getPharmacyById = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    if (!pharmacyId) {
      return res.status(400).json({ error: "Pharmacy ID is required" });
    }

    const db = getFirestore();
    const pharmacyDoc = await db
      .collection(PHARMACIES_COLLECTION)
      .doc(pharmacyId)
      .get();

    if (!pharmacyDoc.exists) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    res.json(serializePharmacy(pharmacyDoc));
  } catch (error) {
    console.error("Error fetching pharmacy:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createPharmacy = async (req, res) => {
  try {
    const pharmacyData = req.body;
    if (!pharmacyData || !pharmacyData.name) {
      return res.status(400).json({ error: "Pharmacy name is required" });
    }

    // Calculate subscription end date (e.g., 30 days from now for monthly)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // In backend/src/controllers/pharmacyController.js
    // Update the createPharmacy function (for Super Admin creating pharmacies):

    const payload = {
      name: pharmacyData.name,
      address: pharmacyData.address || "",
      phone: pharmacyData.phone || "",
      email: pharmacyData.email || "",
      adminUid: pharmacyData.adminUid || "",
      adminId: pharmacyData.adminId || "",

      // 🆕 SEPARATE STATUS FIELDS
      status: pharmacyData.status || "pending", // Admin approval

      subscription: {
        tier: SUBSCRIPTION_TIERS.STARTER,
        billingCycle: "monthly",
        status: "trialing", // 🆕 Super Admin created pharmacies get free trial
        currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },

      usageMetrics: {
        currentSkuCount: 0,
        currentUserCount: 1,
        currentBranchCount: 1,
        dailyTransactionsToday: 0,
        storageUsedMB: 0,
      },

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = getFirestore();

    const pharmacyRef = await db.collection("pharmacies").add(payload);

    if (pharmacyData.adminUid) {
      await admin.auth().setCustomUserClaims(pharmacyData.adminUid, {
        pharmacyId: pharmacyRef.id,
        role: "admin",
      });
    }
    res.status(201).json({ id: pharmacyRef.id, ...payload });

    res.status(201).json({ id: pharmacyRef.id, ...payload });
  } catch (error) {
    console.error("Error creating pharmacy:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updatePharmacy = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const updates = req.body;

    if (!pharmacyId) {
      return res.status(400).json({ error: "Pharmacy ID is required" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Update payload is required" });
    }

    const updatePayload = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = getFirestore();
    await db
      .collection(PHARMACIES_COLLECTION)
      .doc(pharmacyId)
      .update(updatePayload);

    res.json({ id: pharmacyId, ...updates });
  } catch (error) {
    console.error("Error updating pharmacy:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateUserStatusByPharmacyId = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { status } = req.body;

    if (!pharmacyId || !status) {
      return res
        .status(400)
        .json({ error: "Pharmacy ID and status are required" });
    }

    const db = getFirestore();
    const snapshot = await db
      .collection(USERS_COLLECTION)
      .where("pharmacyId", "==", pharmacyId)
      .where("role", "==", "admin")
      .get();

    const updates = snapshot.docs.map((d) =>
      d.ref.update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    );

    const memberSnapshot = await db
      .collection(PHARMACIES_COLLECTION)
      .doc(pharmacyId)
      .collection("members")
      .where("role", "==", "admin")
      .get();

    const memberUpdates = memberSnapshot.docs.map((d) =>
      d.ref.update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    );
    await Promise.all([...updates, ...memberUpdates]);

    res.json({ success: true, updated: snapshot.size });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: error.message });
  }
};
