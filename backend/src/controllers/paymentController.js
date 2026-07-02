import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import {
  chapaClient,
  CHAPA_CALLBACK_URL,
  CHAPA_RETURN_URL,
} from "../config/chapa.js";
import { TIER_PRICING } from "../config/subscriptionConfig.js";

// 🚀 HELPER: Extract pharmacyId from tx_ref to avoid slow Collection Group queries
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

// 🚨 FIXED: Handles both POST (JSON) and GET (Query Params) from Chapa
// export const handlePaymentWebhook = async (req, res) => {
//   try {
//     // Chapa might send POST with JSON body, or GET with query params
//     const trx_ref = req.body?.trx_ref || req.query?.trx_ref;
//     const status = req.body?.status || req.query?.status;
//     const ref_id = req.body?.ref_id || req.query?.ref_id;

//     console.log("🟢 Chapa webhook received:", {
//       trx_ref,
//       status,
//       method: req.method,
//     });

//     if (!trx_ref) {
//       return res.status(400).json({ error: "Missing trx_ref" });
//     }

//     const db = getFirestore();

//     // 🚀 OPTIMIZATION: Extract pharmacyId from tx_ref instead of using collectionGroup
//     const pharmacyId = getPharmacyIdFromTxRef(trx_ref);
//     if (!pharmacyId) {
//       return res.status(400).json({ error: "Invalid tx_ref format" });
//     }

//     const paymentsSnapshot = await db
//       .collection("pharmacies")
//       .doc(pharmacyId)
//       .collection("payments")
//       .where("txRef", "==", trx_ref)
//       .limit(1)
//       .get();
//     if (paymentsSnapshot.empty) {
//       return res.status(404).json({ error: "Payment not found" });
//     }

//     const paymentDoc = paymentsSnapshot.docs[0];
//     const paymentData = paymentDoc.data();

//     if (paymentData.status === "completed") {
//       return res.json({ message: "Already processed" });
//     }

//     const pharmacyRef = db.collection("pharmacies").doc(pharmacyId);

//     if (status === "success") {
//       await db.runTransaction(async (transaction) => {
//         const periodEnd = new Date();
//         const daysToAdd = paymentData.billingCycle === "yearly" ? 365 : 30;
//         periodEnd.setDate(periodEnd.getDate() + daysToAdd);

//         transaction.update(pharmacyRef, {
//           "subscription.status": "active",
//           "subscription.currentPeriodEnd":
//             admin.firestore.Timestamp.fromDate(periodEnd),
//           "subscription.lastPaymentAt":
//             admin.firestore.FieldValue.serverTimestamp(),
//           updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//         });

//         transaction.update(paymentDoc.ref, {
//           status: "completed",
//           completedAt: admin.firestore.FieldValue.serverTimestamp(),
//           chapaRefId: ref_id,
//         });
//       });
//       console.log("✅ Payment processed successfully:", trx_ref);
//     } else {
//       await paymentDoc.ref.update({
//         status: "failed",
//         failedAt: admin.firestore.FieldValue.serverTimestamp(),
//       });
//       console.log("❌ Payment failed:", trx_ref);
//     }

//     return res.json({ message: "Webhook processed" });
//   } catch (error) {
//     console.error("Webhook processing error:", error);
//     return res.status(500).json({ error: error.message });
//   }
// };
// 🚀 OPTIMIZED: Uses direct path instead of collectionGroup

// 🚀 OPTIMIZED & BULLETPROOF: Actively verifies with Chapa if local status is pending

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

    // If already processed, return the full receipt data
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
        // 🆕 Full Chapa response for the receipt
        chapaResponse: paymentData.chapaResponse || {},
        // 🆕 Pharmacy info for the receipt
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
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            transaction.update(paymentDoc.ref, {
              status: "completed",
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              chapaRefId: chapaData.reference || tx_ref,
              chapaResponse: chapaData, // 🆕 Save full Chapa response to DB
            });
          });

          // Fetch pharmacy info to return immediately
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
            chapaResponse: chapaData,
            pharmacyInfo: {
              name: pharmacyData.name,
              email: pharmacyData.email,
              phone: pharmacyData.phone,
              address: pharmacyData.address,
            },
          });
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

//verify payment working version
// export const verifyPaymentStatus = async (req, res) => {
//   try {
//     const { tx_ref } = req.query;
//     if (!tx_ref) return res.status(400).json({ error: 'tx_ref is required' });

//     const db = getFirestore();
//     const pharmacyId = getPharmacyIdFromTxRef(tx_ref);

//     if (!pharmacyId) return res.status(400).json({ error: 'Invalid tx_ref format' });

//     // 1. Check local Firestore first
//     const paymentSnap = await db.collection('pharmacies').doc(pharmacyId)
//       .collection('payments').where('txRef', '==', tx_ref).limit(1).get();

//     if (paymentSnap.empty) return res.status(404).json({ error: 'Payment not found' });

//     const paymentDoc = paymentSnap.docs[0];
//     const paymentData = paymentDoc.data();

//     // 2. If already processed, just return the status instantly
//     if (paymentData.status === 'completed' || paymentData.status === 'failed') {
//       return res.json({
//         status: paymentData.status,
//         amount: paymentData.amount,
//         tier: paymentData.tier,
//         billingCycle: paymentData.billingCycle
//       });
//     }

//     // 3. 🚀 ACTIVE VERIFICATION: If still pending, ask Chapa directly!
//     if (paymentData.status === 'pending') {
//       try {
//         // Call Chapa's verification API
//         const chapaResponse = await chapaClient.get(`/transaction/verify/${tx_ref}`);
//         const chapaData = chapaResponse.data.data;
//         console.log("chapa response ", chapaResponse.data);
//         // If Chapa says it's successful, process it immediately!
//         if (chapaData.status === 'success') {
//           const pharmacyRef = db.collection('pharmacies').doc(pharmacyId);

//           await db.runTransaction(async (transaction) => {
//             const periodEnd = new Date();
//             const daysToAdd = paymentData.billingCycle === 'yearly' ? 365 : 30;
//             periodEnd.setDate(periodEnd.getDate() + daysToAdd);

//             // Activate the subscription
//             transaction.update(pharmacyRef, {
//               'subscription.status': 'active',
//               'subscription.currentPeriodEnd': admin.firestore.Timestamp.fromDate(periodEnd),
//               'subscription.lastPaymentAt': admin.firestore.FieldValue.serverTimestamp(),
//               updatedAt: admin.firestore.FieldValue.serverTimestamp()
//             });

//             // Mark payment as completed
//             transaction.update(paymentDoc.ref, {
//               status: 'completed',
//               completedAt: admin.firestore.FieldValue.serverTimestamp(),
//               chapaRefId: chapaData.reference || tx_ref, // ✅ Fixed the undefined bug!
//               chapaResponse: chapaData
//             });
//           });

//           console.log('✅ Payment verified via polling and activated:', tx_ref);

//           return res.json({
//             status: 'completed',
//             amount: paymentData.amount,
//             tier: paymentData.tier,
//             billingCycle: paymentData.billingCycle
//           });
//         }
//       } catch (chapaError) {
//         // If Chapa verification fails (e.g., transaction not found yet), just fallback to local status
//         console.warn('Chapa active verification failed, falling back to local status:', chapaError.message);
//       }
//     }

//     // 4. Return local pending status if Chapa hasn't confirmed it yet
//     return res.json({
//       status: paymentData.status,
//       amount: paymentData.amount,
//       tier: paymentData.tier,
//       billingCycle: paymentData.billingCycle
//     });

//   } catch (error) {
//     console.error('Payment verification error:', error);
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
