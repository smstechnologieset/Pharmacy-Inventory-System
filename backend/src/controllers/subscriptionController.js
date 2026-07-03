import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import axios from "axios";

const CHAPA_API_URL = "https://api.chapa.co/v1";
const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;

// Map frontend tier IDs to actual numeric prices (in ETB)
const PRICING_MAP = {
  starter: { monthly: 1500, yearly: 15000 },
  growth_gizmo: { monthly: 3000, yearly: 28000 },
  business_medipro: { monthly: 5000, yearly: 42000 },
};

// 🟢 1. INITIATE SUBSCRIPTION
export const initiateSubscription = async (req, res) => {
  try {
    const uid = req.user.uid; // From authMiddleware
    const { pharmacyData, subscriptionData, documents } = req.body;

    const { selectedTier, billingCycle } = subscriptionData;
    const amount = PRICING_MAP[selectedTier]?.[billingCycle];
    if (!amount) return res.status(400).json({ error: "Invalid subscription plan" });

    const tx_ref = `pharma-${uid}-${Date.now()}`;
    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);
    
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User not found");
    
    const userData = userDoc.data();
    let pharmacyId = userData.pharmacyId;
    let pharmacyRef;

    // Prevent duplicate pharmacies if user refreshes the page
    if (pharmacyId) {
      pharmacyRef = db.collection("pharmacies").doc(pharmacyId);
      const existingDoc = await pharmacyRef.get();
      if (!existingDoc.exists || existingDoc.data().status !== "pending_payment") {
        throw new Error("You already have an active or processing pharmacy.");
      }
    } else {
      pharmacyRef = db.collection("pharmacies").doc();
      pharmacyId = pharmacyRef.id;
    }

    // Create/Update Pharmacy document with "pending_payment" status
    const pharmacyPayload = {
      name: pharmacyData.pharmacyName,      phone: pharmacyData.phone,
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
      tx_ref: tx_ref, // Stored at root for easy webhook querying
      subscription: {
        tier: selectedTier,
        billingCycle: billingCycle,
        status: "pending_payment",
        tx_ref: tx_ref,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      usageMetrics: {
        currentSkuCount: 0, currentUserCount: 1, currentBranchCount: 1,
        dailyTransactionsToday: 0, storageUsedMB: 0
      },
      complianceDocuments: documents || {},
      status: "pending_payment",
      adminUid: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await pharmacyRef.set(pharmacyPayload, { merge: true });

    // Update User document
    await userRef.update({
      pharmacyId: pharmacyId,
      pharmacyName: pharmacyData.pharmacyName,
      status: "pending_payment",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Initialize Chapa Payment
    const chapaResponse = await axios.post(
      `${CHAPA_API_URL}/transaction/initialize`,
      {
        amount: amount.toString(),
        currency: "ETB",
        email: pharmacyData.email,
        first_name: pharmacyData.name || "Pharmacy",
        last_name: "Owner",
        tx_ref: tx_ref,        callback_url: `${process.env.BACKEND_URL}/api/subscription/webhook`,
        return_url: `${process.env.FRONTEND_URL}/payment/success?tx_ref=${tx_ref}`,
        customization: {
          title: "PharmaCare Subscription",
          description: `${selectedTier} Plan - ${billingCycle}ly`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      success: true,
      checkout_url: chapaResponse.data.data.checkout_url,
      tx_ref: tx_ref,
      pharmacyId: pharmacyId,
    });

  } catch (error) {
    console.error("Error initiating subscription:", error);
    res.status(500).json({ error: error.message || "Failed to initiate payment" });
  }
};

// 🟢 2. HANDLE CHAPA WEBHOOK
export const handleChapaWebhook = async (req, res) => {
  try {
    const { tx_ref } = req.body;
    if (!tx_ref) return res.status(400).json({ error: "Missing tx_ref" });

    // 1. Verify payment with Chapa API
    const verification = await axios.get(
      `${CHAPA_API_URL}/transaction/verify/${tx_ref}`,
      { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } }
    );

    const chapaData = verification.data.data;

    if (chapaData && chapaData.status === "success") {
      const db = getFirestore();
      
      // Find the pharmacy by tx_ref
      const pharmaciesSnapshot = await db
        .collection("pharmacies")
        .where("tx_ref", "==", tx_ref)
        .limit(1)        .get();

      if (pharmaciesSnapshot.empty) {
        return res.status(404).json({ error: "Pharmacy not found for this tx_ref" });
      }

      const pharmacyDoc = pharmaciesSnapshot.docs[0];
      const pharmacyId = pharmacyDoc.id;
      const pharmacyData = pharmacyDoc.data();
      const uid = pharmacyData.adminUid;

      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + (pharmacyData.subscription.billingCycle === "yearly" ? 365 : 30));

      // 2. Finalize everything in a Firestore transaction
      await db.runTransaction(async (transaction) => {
        const pharmacyRef = db.collection("pharmacies").doc(pharmacyId);
        const userRef = db.collection("users").doc(uid);

        // Update Pharmacy to "active"
        transaction.update(pharmacyRef, {
          "subscription.status": "active",
          "subscription.currentPeriodStart": admin.firestore.FieldValue.serverTimestamp(),
          "subscription.currentPeriodEnd": admin.firestore.Timestamp.fromDate(periodEnd),
          "subscription.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
          status: "active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update User to "Active"
        transaction.update(userRef, {
          role: "admin",
          status: "Active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Add user to pharmacy members subcollection
        const memberRef = pharmacyRef.collection("members").doc(uid);
        const userDoc = await transaction.get(userRef);
        transaction.set(memberRef, {
          uid,
          email: userDoc.data().email,
          name: userDoc.data().name || "",
          role: "admin",
          pharmacyId: pharmacyId,
          status: "active", // Changed from "pending" to "active"
          isDeleted: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });      });

      // 3. Set Firebase Custom Claims (Must be outside transaction)
      await admin.auth().setCustomUserClaims(uid, {
        pharmacyId: pharmacyId,
        role: "admin",
      });
    }

    // Always respond with 200 so Chapa stops retrying the webhook
    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// Keep your existing functions if you had any, otherwise leave them empty for now
export const getSubscriptionStatus = async (req, res) => { res.json({ status: "ok" }); };
export const upgradeSubscription = async (req, res) => { res.json({ status: "ok" }); };
