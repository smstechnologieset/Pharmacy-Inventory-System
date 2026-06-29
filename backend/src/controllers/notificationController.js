import { getFirestore } from "../config/firebase.js";
import { webpush } from "../config/webPush.js";
import { sendStockAlertEmail } from "../services/emailService.js";
import {
  ValidationError,
  InternalServerError,
  NotFoundError,
} from "../utils/AppError.js";

const SUBSCRIPTIONS_COLLECTION = "push_subscriptions";

// Subscribe to push notifications

export const subscribe = async (req, res, next) => {
  try {
    const { subscription, userId, pharmacyId } = req.body; // 👈 ADD pharmacyId

    if (!subscription || !subscription.endpoint) {
      throw new ValidationError("Invalid subscription object");
    }

    const db = getFirestore();
    const subscriptionId = `${userId}_${Date.now()}`;

    await db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .doc(subscriptionId)
      .set({
        userId: userId || "anonymous",
        pharmacyId: pharmacyId || null, // 👈 ADD THIS
        subscription,
        createdAt: new Date().toISOString(),
        isActive: true,
      });

    res.json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    next(error);
  }
};

// Unsubscribe from push notifications
export const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      throw new ValidationError("Endpoint is required");
    }

    const db = getFirestore();
    const subscriptionsRef = db.collection(SUBSCRIPTIONS_COLLECTION);
    const snapshot = await subscriptionsRef
      .where("subscription.endpoint", "==", endpoint)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError("Subscription");
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });
    await batch.commit();

    res.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    next(error);
  }
};

// Send notification to all active subscribers
export const sendNotification = async (req, res, next) => {
  try {
    const { title, body, icon, url } = req.body;

    if (!title || !body) {
      throw new ValidationError("Title and body are required");
    }

    const db = getFirestore();
    const snapshot = await db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where("isActive", "==", true)
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, message: "No active subscribers" });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/icon-192x192.png",
      url: url || "/",
    });

    const sendPromises = snapshot.docs.map(async (doc) => {
      const subscription = doc.data().subscription;
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (error) {
        if (error.statusCode === 410) {
          // Subscription expired or invalid, mark as inactive
          await db.collection(SUBSCRIPTIONS_COLLECTION).doc(doc.id).update({
            isActive: false,
          });
        }
        console.error(`Failed to send to ${doc.id}:`, error.message);
      }
    });

    await Promise.all(sendPromises);

    res.json({
      success: true,
      message: `Notification sent to ${snapshot.size} subscribers`,
    });
  } catch (error) {
    next(error);
  }
};

// Check stock levels and send notifications
// export const checkStockAndNotify = async (req, res, next) => {
//   try {
//     const { medicineId, medicineName, quantity, minStock, expiryDate } =
//       req.body;

//     if (!medicineId || !medicineName || quantity === undefined) {
//       throw new ValidationError("Medicine details are required");
//     }

//     const notifications = [];
//     const today = new Date();

//     // Check if out of stock
//     if (quantity === 0) {
//       notifications.push({
//         title: "⚠️ Out of Stock Alert",
//         body: `${medicineName} is now out of stock!`,
//       });
//     }
//     // Check if low stock
//     else if (minStock && quantity <= minStock) {
//       notifications.push({
//         title: "📉 Low Stock Alert",
//         body: `${medicineName} has only ${quantity} units left (minimum: ${minStock})`,
//       });
//     }

//     // Check if expired
//     if (expiryDate) {
//       const expiry = new Date(expiryDate);
//       if (expiry <= today) {
//         notifications.push({
//           title: "🚨 Expired Medicine Alert",
//           body: `${medicineName} has expired on ${expiry.toLocaleDateString()}`,
//         });
//       }
//     }

//     // Send all notifications
//     if (notifications.length > 0) {
//       const db = getFirestore();
//       const snapshot = await db
//         .collection(SUBSCRIPTIONS_COLLECTION)
//         .where("isActive", "==", true)
//         .get();

//       const sendPromises = [];

//       for (const notification of notifications) {
//         const payload = JSON.stringify({
//           ...notification,
//           icon: "/icon-192x192.png",
//           url: `/inventory/medicine/${medicineId}`,
//         });

//         snapshot.docs.forEach((doc) => {
//           const subscription = doc.data().subscription;
//           sendPromises.push(
//             webpush
//               .sendNotification(subscription, payload)
//               .catch(async (error) => {
//                 if (error.statusCode === 410) {
//                   await db
//                     .collection(SUBSCRIPTIONS_COLLECTION)
//                     .doc(doc.id)
//                     .update({
//                       isActive: false,
//                     });
//                 }
//               }),
//           );
//         });
//       }

//       await Promise.all(sendPromises);

//       res.json({
//         success: true,
//         message: `Sent ${notifications.length} notification(s) to ${snapshot.size} subscribers`,
//         notifications,
//       });
//     } else {
//       res.json({ success: true, message: "No notifications needed" });
//     }
//   } catch (error) {
//     next(error);
//   }
// };
// Check stock levels and send notifications (push + email to pharmacy admin)
// Check stock levels and send notifications (push + email to pharmacy admin)
export const checkStockAndNotify = async (req, res) => {
  try {
    const {
      medicineId,
      medicineName,
      quantity,
      minStock,
      expiryDate,
      batchNo,
      pharmacyId,
      pharmacyName,
    } = req.body;

    if (!medicineId || !medicineName || quantity === undefined) {
      return res.status(400).json({ error: "Medicine details are required" });
    }

    const alerts = [];
    const today = new Date();

    // Check if out of stock
    if (quantity === 0) {
      alerts.push({
        type: "out_of_stock",
        medicineId,
        medicineName,
        batchNo: batchNo || "N/A",
        quantity,
        expiryDate: expiryDate
          ? new Date(expiryDate).toLocaleDateString()
          : "N/A",
      });
    }
    // Check if low stock
    else if (minStock && quantity <= minStock) {
      alerts.push({
        type: "low_stock",
        medicineId,
        medicineName,
        batchNo: batchNo || "N/A",
        quantity,
        expiryDate: expiryDate
          ? new Date(expiryDate).toLocaleDateString()
          : "N/A",
      });
    }

    // Check if expired
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry <= today) {
        alerts.push({
          type: "expired",
          medicineId,
          medicineName,
          batchNo: batchNo || "N/A",
          quantity,
          expiryDate: expiry.toLocaleDateString(),
        });
      }
    }

    if (alerts.length === 0) {
      return res.json({
        success: true,
        message: "No notifications needed",
        alerts: [],
      });
    }

    const db = getFirestore();

    // ── 1. Send Push Notifications ONLY to users from the SAME PHARMACY ──
    // 👇 THIS IS THE FIX: Filter by pharmacyId
    let pushQuery = db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where("isActive", "==", true);

    if (pharmacyId) {
      pushQuery = pushQuery.where("pharmacyId", "==", pharmacyId);
    }

    const pushSnapshot = await pushQuery.get();

    const pushPromises = [];

    for (const alert of alerts) {
      let title = "📉 Low Stock Alert";
      let body = `${alert.medicineName} has only ${alert.quantity} units left`;

      if (alert.type === "out_of_stock") {
        title = "⚠️ Out of Stock";
        body = `${alert.medicineName} is now out of stock`;
      } else if (alert.type === "expired") {
        title = "🚨 Expired Medicine";
        body = `${alert.medicineName} expired on ${alert.expiryDate}`;
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: "/icon-192x192.png",
        url: `/inventory/medicine/${medicineId}`,
      });

      pushSnapshot.docs.forEach((doc) => {
        const subscription = doc.data().subscription;
        pushPromises.push(
          webpush
            .sendNotification(subscription, payload)
            .catch(async (error) => {
              if (error.statusCode === 410) {
                await db
                  .collection(SUBSCRIPTIONS_COLLECTION)
                  .doc(doc.id)
                  .update({
                    isActive: false,
                  });
              }
            }),
        );
      });
    }

    await Promise.all(pushPromises);

    // ── 2. Send Email to the PHARMACY'S ADMIN(S) ──
    let emailResult = { success: false, message: "No pharmacy ID provided" };

    if (pharmacyId) {
      try {
        // Query Firestore for all admins of this specific pharmacy
        const adminSnapshot = await db
          .collection("users")
          .where("pharmacyId", "==", pharmacyId)
          .where("role", "==", "admin")
          .where("isDeleted", "==", false)
          .get();

        const adminEmails = adminSnapshot.docs
          .map((doc) => doc.data().email)
          .filter(Boolean);

        if (adminEmails.length > 0) {
          emailResult = await sendStockAlertEmail(
            alerts,
            adminEmails,
            pharmacyName,
          );
        } else {
          console.warn(
            `⚠️ No admin found for pharmacy ${pharmacyId}. Email not sent.`,
          );
          emailResult = {
            success: false,
            message: "No admin found for this pharmacy",
          };
        }
      } catch (emailError) {
        console.error(
          "Email notification failed (push still sent):",
          emailError.message,
        );
        emailResult = { success: false, message: emailError.message };
      }
    }

    res.json({
      success: true,
      message: `Sent ${alerts.length} alert(s) to ${pushSnapshot.size} push subscriber(s) from pharmacy ${pharmacyName || pharmacyId}`,
      alerts,
      email: emailResult,
    });
  } catch (error) {
    console.error("Check stock error:", error);
    res.status(500).json({ error: "Failed to check stock" });
  }
};
export const getVapidPublicKey = (req, res, next) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
      throw new InternalServerError("VAPID_PUBLIC_KEY not configured");
    }

    res.json({ publicKey });
  } catch (error) {
    next(error);
  }
};
