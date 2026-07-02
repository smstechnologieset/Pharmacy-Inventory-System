import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import { SUBSCRIPTION_TIERS } from "../config/subscriptionConfig.js";

export const completeRegistration = async (req, res) => {
  try {
    const uid = req.user.uid; // From authMiddleware
    const { pharmacyData, subscriptionData, documents } = req.body;

    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);
    const pharmaciesRef = db.collection("pharmacies");

    // 1. USE A TRANSACTION to ensure data consistency
    const pharmacyId = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists)
        throw new Error("User profile not found. Please restart signup.");

      // Calculate subscription end date
      const periodEnd = new Date();
      periodEnd.setDate(
        periodEnd.getDate() +
          (subscriptionData.billingCycle === "yearly" ? 365 : 30),
      );

      // A. Create the Pharmacy document
      const newPharmacyRef = pharmaciesRef.doc();
      // In backend/src/controllers/authController.js
      // Find the pharmacyPayload object and change it:

      const pharmacyPayload = {
        name: pharmacyData.pharmacyName,
        phone: pharmacyData.phone,
        email: pharmacyData.email,
        licenseNumber: pharmacyData.licenseNumber || "",
        taxId: pharmacyData.taxId || "",
        pharmacyType: pharmacyData.pharmacyType || "Retail",
        address: pharmacyData.address || {},
        businessInfo: {
          businessEmail: pharmacyData.businessEmail || "",
          businessPhone: pharmacyData.businessPhone || "",
          website: pharmacyData.website || "",
        },

        // 🆕 SEPARATE STATUS FIELDS
        status: "pending", // Admin approval status (starts as pending)

        subscription: {
          tier: subscriptionData.selectedTier || SUBSCRIPTION_TIERS.STARTER,
          billingCycle: subscriptionData.billingCycle || "monthly",
          status: "pending_payment", // 🆕 Payment status (starts as pending_payment)
          currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
          currentPeriodEnd: null, // Will be set after payment
          lastPaymentAt: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },

        usageMetrics: {
          currentSkuCount: 0,
          currentUserCount: 1,
          currentBranchCount: 1,
          dailyTransactionsToday: 0,
          storageUsedMB: 0,
        },

        complianceDocuments: documents || {},
        adminUid: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(newPharmacyRef, pharmacyPayload);

      // B. Update the User document with the new pharmacyId
      transaction.update(userRef, {
        pharmacyId: newPharmacyRef.id,
        pharmacyName: pharmacyData.pharmacyName,
        role: "admin",
        status: "Active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // C. Add user to the pharmacy's members subcollection
      const memberRef = newPharmacyRef.collection("members").doc(uid);
      transaction.set(memberRef, {
        uid,
        email: userDoc.data().email,
        name: userDoc.data().name || "",
        role: "admin",
        pharmacyId: newPharmacyRef.id,
        status: "pending",
        isDeleted: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return newPharmacyRef.id;
    });

    // 2. SET CUSTOM CLAIMS (Must be done outside the Firestore transaction)
    await admin.auth().setCustomUserClaims(uid, {
      pharmacyId: pharmacyId,
      role: "admin",
    });

    res.status(200).json({ success: true, pharmacyId });
  } catch (error) {
    console.error("Error completing registration:", error);
    res.status(500).json({ error: error.message });
  }
};
