import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import {
  chapaClient,
  CHAPA_CALLBACK_URL,
  CHAPA_RETURN_URL,
} from "../config/chapa.js";
import { TIER_PRICING } from "../config/subscriptionConfig.js";

const getPharmacyIdFromTxRef = (txRef) => {
  // tx_ref format: signup_{pharmacyId}_{timestamp}
  const parts = txRef.split("_");
  if (parts.length >= 2) return parts[1];
  return null;
};

export const initializeSignupPayment = async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getFirestore();

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "User not found" });

    const userData = userDoc.data();
    const pharmacyId = userData.pharmacyId;
    if (!pharmacyId)
      return res.status(400).json({ error: "No pharmacy found." });

    const pharmacyDoc = await db.collection("pharmacies").doc(pharmacyId).get();
    const pharmacy = pharmacyDoc.data();

    if (pharmacy.subscription?.status !== "pending_payment") {
      return res
        .status(400)
        .json({ error: "Pharmacy is not awaiting payment" });
    }

    const { billingCycle } = req.body;
    const tier = pharmacy.subscription.tier;

    // 🚨 ADD THIS LOG: This will print the exact keys being used
    console.log("🔍 DEBUG PAYMENT INIT:", {
      tierFromDB: tier,
      billingCycleFromFrontend: billingCycle,
      availableTiersInConfig: Object.keys(TIER_PRICING),
    });
    const pricing = TIER_PRICING[tier]?.[billingCycle];

    if (!pricing) {
      return res.status(400).json({ error: "Invalid billing cycle or tier" });
    }

    const txRef = `signup_${pharmacyId}_${Date.now()}`;

    const paymentRef = db
      .collection("pharmacies")
      .doc(pharmacyId)
      .collection("payments")
      .doc();

    await paymentRef.set({
      txRef,
      type: "signup",
      tier,
      billingCycle,
      amount: pricing.amount,
      currency: pricing.currency,
      status: "pending",
      userId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const response = await chapaClient.post("/transaction/initialize", {
      amount: pricing.amount.toString(),
      currency: pricing.currency,
      email: userData.email,
      first_name: userData.name?.split(" ")[0] || "Pharmacy",
      last_name: userData.name?.split(" ").slice(1).join(" ") || "Owner",
      tx_ref: txRef,
      callback_url: CHAPA_CALLBACK_URL,
      return_url: `${CHAPA_RETURN_URL}?tx_ref=${txRef}`,
    });

    return res.json({
      checkoutUrl: response.data.data.checkout_url,
      txRef,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: error.response?.data?.message || error.message });
    }
  }
};
export const verifyPaymentStatus = async (req, res) => {
  try {
    const { tx_ref } = req.query;
    if (!tx_ref) return res.status(400).json({ error: "tx_ref is required" });

    const db = getFirestore();
    const pharmacyId = getPharmacyIdFromTxRef(tx_ref);
    if (!pharmacyId)
      return res.status(400).json({ error: "Invalid tx_ref format" });

    const paymentSnap = await db
      .collection("pharmacies")
      .doc(pharmacyId)
      .collection("payments")
      .where("txRef", "==", tx_ref)
      .limit(1)
      .get();

    if (paymentSnap.empty)
      return res.status(404).json({ error: "Payment not found" });

    const paymentDoc = paymentSnap.docs[0];
    const paymentData = paymentDoc.data();

    // 🚨 SECURITY FIX: Ensure the authenticated user owns this payment
    if (req.user.uid !== paymentData.userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You do not own this transaction" });
    }

    // If already processed, return receipt data
    if (paymentData.status === "completed") {
      const pharmacyDoc = await db
        .collection("pharmacies")
        .doc(pharmacyId)
        .get();
      const pharmacyData = pharmacyDoc.data();

      return res.json({
        status: "completed",
        amount: paymentData.amount,
        tier: paymentData.tier,
        billingCycle: paymentData.billingCycle,
        chapaResponse: paymentData.chapaResponse || {},
        pharmacyInfo: {
          name: pharmacyData.name,
          email: pharmacyData.email,
          phone: pharmacyData.phone,
          address: pharmacyData.address,
        },
      });
    }

    // Active verification with Chapa if pending
    if (paymentData.status === "pending") {
      try {
        const chapaResponse = await chapaClient.get(
          `/transaction/verify/${tx_ref}`,
        );
        const chapaData = chapaResponse.data.data;

        if (chapaData.status === "success") {
          await activateSubscription(
            db,
            pharmacyId,
            paymentDoc,
            paymentData,
            chapaData,
          );

          // Fetch and return receipt data...
          return res.json({ status: "completed", data /* ...receipt data */ });
        }
      } catch (chapaError) {
        console.warn("Chapa active verification failed:", chapaError.message);
      }
    }

    return res.json({ status: paymentData.status });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const activateSubscription = async (
  db,
  pharmacyId,
  paymentDoc,
  paymentData,
  chapaData,
) => {
  const pharmacyRef = db.collection("pharmacies").doc(pharmacyId);

  await db.runTransaction(async (transaction) => {
    const periodEnd = new Date();
    const daysToAdd = paymentData.billingCycle === "yearly" ? 365 : 30;
    periodEnd.setDate(periodEnd.getDate() + daysToAdd);

    transaction.update(pharmacyRef, {
      "subscription.status": "active",
      "subscription.currentPeriodEnd":
        admin.firestore.Timestamp.fromDate(periodEnd),
      "subscription.lastPaymentAt":
        admin.firestore.FieldValue.serverTimestamp(),
      status: "active", // Auto-approve the pharmacy status upon successful payment
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.update(paymentDoc.ref, {
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      chapaRefId: chapaData.reference || paymentData.txRef,
      chapaResponse: chapaData,
    });
  });
};

// export const verifyPaymentStatus = async (req, res) => {
//   try {
//     const { tx_ref } = req.query;
//     if (!tx_ref) return res.status(400).json({ error: "tx_ref is required" });

//     const db = getFirestore();
//     const pharmacyId = getPharmacyIdFromTxRef(tx_ref);
//     if (!pharmacyId)
//       return res.status(400).json({ error: "Invalid tx_ref format" });

//     const paymentSnap = await db
//       .collection("pharmacies")
//       .doc(pharmacyId)
//       .collection("payments")
//       .where("txRef", "==", tx_ref)
//       .limit(1)
//       .get();

//     if (paymentSnap.empty)
//       return res.status(404).json({ error: "Payment not found" });

//     const paymentDoc = paymentSnap.docs[0];
//     const paymentData = paymentDoc.data();

//     // If already processed, return the full receipt data
//     if (paymentData.status === "completed") {
//       const pharmacyDoc = await db
//         .collection("pharmacies")
//         .doc(pharmacyId)
//         .get();
//       const pharmacyData = pharmacyDoc.data();

//       return res.json({
//         status: "completed",
//         amount: paymentData.amount,
//         tier: paymentData.tier,
//         billingCycle: paymentData.billingCycle,
//         // 🆕 Full Chapa response for the receipt
//         chapaResponse: paymentData.chapaResponse || {},
//         // 🆕 Pharmacy info for the receipt
//         pharmacyInfo: {
//           name: pharmacyData.name,
//           email: pharmacyData.email,
//           phone: pharmacyData.phone,
//           address: pharmacyData.address,
//         },
//       });
//     }

//     // Active verification with Chapa if pending
//     if (paymentData.status === "pending") {
//       try {
//         const chapaResponse = await chapaClient.get(
//           `/transaction/verify/${tx_ref}`,
//         );
//         const chapaData = chapaResponse.data.data;

//         if (chapaData.status === "success") {
//           const pharmacyRef = db.collection("pharmacies").doc(pharmacyId);

//           await db.runTransaction(async (transaction) => {
//             const periodEnd = new Date();
//             const daysToAdd = paymentData.billingCycle === "yearly" ? 365 : 30;
//             periodEnd.setDate(periodEnd.getDate() + daysToAdd);

//             transaction.update(pharmacyRef, {
//               "subscription.status": "active",
//               "subscription.currentPeriodEnd":
//                 admin.firestore.Timestamp.fromDate(periodEnd),
//               "subscription.lastPaymentAt":
//                 admin.firestore.FieldValue.serverTimestamp(),
//               updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//             });

//             transaction.update(paymentDoc.ref, {
//               status: "completed",
//               completedAt: admin.firestore.FieldValue.serverTimestamp(),
//               chapaRefId: chapaData.reference || tx_ref,
//               chapaResponse: chapaData, // 🆕 Save full Chapa response to DB
//             });
//           });

//           // Fetch pharmacy info to return immediately
//           const pharmacyDoc = await db
//             .collection("pharmacies")
//             .doc(pharmacyId)
//             .get();
//           const pharmacyData = pharmacyDoc.data();

//           return res.json({
//             status: "completed",
//             amount: paymentData.amount,
//             tier: paymentData.tier,
//             billingCycle: paymentData.billingCycle,
//             chapaResponse: chapaData,
//             pharmacyInfo: {
//               name: pharmacyData.name,
//               email: pharmacyData.email,
//               phone: pharmacyData.phone,
//               address: pharmacyData.address,
//             },
//           });
//         }
//       } catch (chapaError) {
//         console.warn("Chapa active verification failed:", chapaError.message);
//       }
//     }

//     return res.json({ status: paymentData.status });
//   } catch (error) {
//     console.error("Payment verification error:", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

export const retryPayment = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { tx_ref } = req.body;
    const db = getFirestore();

    // Find the failed payment
    const paymentsSnapshot = await db
      .collectionGroup("payments")
      .where("txRef", "==", tx_ref)
      .limit(1)
      .get();

    if (paymentsSnapshot.empty) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const paymentDoc = paymentsSnapshot.docs[0];
    const paymentData = paymentDoc.data();

    // Verify user owns this payment
    if (paymentData.userId !== uid) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Only allow retry if payment failed
    if (paymentData.status !== "failed") {
      return res.status(400).json({
        error: "Can only retry failed payments",
        currentStatus: paymentData.status,
      });
    }

    // Get pharmacy and user details
    const pharmacyId = paymentDoc.ref.parent.parent.id;
    const pharmacyDoc = await db.collection("pharmacies").doc(pharmacyId).get();
    const userDoc = await db.collection("users").doc(uid).get();

    const pharmacy = pharmacyDoc.data();
    const userData = userDoc.data();

    // Generate new transaction reference
    const newTxRef = `signup_${pharmacyId}_${Date.now()}`;

    // Create new payment record
    const newPaymentRef = db
      .collection("pharmacies")
      .doc(pharmacyId)
      .collection("payments")
      .doc();
    await newPaymentRef.set({
      txRef: newTxRef,
      type: "signup",
      tier: paymentData.tier,
      billingCycle: paymentData.billingCycle,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: "pending",
      userId: uid,
      previousTxRef: tx_ref,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Initialize new payment with Chapa
    const response = await chapaClient.post("/transaction/initialize", {
      amount: paymentData.amount.toString(),
      currency: paymentData.currency,
      email: userData.email,
      first_name: userData.name?.split(" ")[0] || "Pharmacy",
      last_name: userData.name?.split(" ").slice(1).join(" ") || "Owner",
      phone_number: userData.phone || "",
      tx_ref: newTxRef,
      callback_url: CHAPA_CALLBACK_URL,
      return_url: `${CHAPA_RETURN_URL}?tx_ref=${newTxRef}`,
      customization: {
        title: "PharmaCare Subscription (Retry)",
        description: `${paymentData.tier.replace("_", " ")} Plan - ${paymentData.billingCycle}`,
      },
    });

    // Mark old payment as retried
    await paymentDoc.ref.update({
      status: "retried",
      retriedAt: admin.firestore.FieldValue.serverTimestamp(),
      newTxRef: newTxRef,
    });

    res.json({
      checkoutUrl: response.data.data.checkout_url,
      txRef: newTxRef,
    });
  } catch (error) {
    console.error("Payment retry error:", error);
    res.status(500).json({ error: error.message });
  }
};
