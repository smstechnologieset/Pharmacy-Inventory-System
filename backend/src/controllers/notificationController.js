import { getFirestore } from "../config/firebase.js";
import { webpush } from "../config/webPush.js";

const SUBSCRIPTIONS_COLLECTION = "push_subscriptions";

// Subscribe to push notifications
export const subscribe = async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription object" });
    }

    const db = getFirestore();
    const subscriptionId = `${userId}_${Date.now()}`;

    await db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .doc(subscriptionId)
      .set({
        userId: userId || "anonymous",
        subscription,
        createdAt: new Date().toISOString(),
        isActive: true,
      });

    res.json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
};

// Unsubscribe from push notifications
export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint is required" });
    }

    const db = getFirestore();
    const subscriptionsRef = db.collection(SUBSCRIPTIONS_COLLECTION);
    const snapshot = await subscriptionsRef
      .where("subscription.endpoint", "==", endpoint)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });
    await batch.commit();

    res.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
};

// Send notification to all active subscribers
export const sendNotification = async (req, res) => {
  try {
    const { title, body, icon, url } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
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
    console.error("Send notification error:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
};

// Check stock levels and send notifications
export const checkStockAndNotify = async (req, res) => {
  try {
    const { medicineId, medicineName, quantity, minStock, expiryDate } =
      req.body;
    console.log("medicine id: ", medicineId);
    if (!medicineId || !medicineName || quantity === undefined) {
      return res.status(400).json({ error: "Medicine details are required" });
    }

    const notifications = [];
    const today = new Date();

    // Check if out of stock
    if (quantity === 0) {
      notifications.push({
        title: "⚠️ Out of Stock Alert",
        body: `${medicineName} is now out of stock!`,
      });
    }
    // Check if low stock
    else if (minStock && quantity <= minStock) {
      notifications.push({
        title: "📉 Low Stock Alert",
        body: `${medicineName} has only ${quantity} units left (minimum: ${minStock})`,
      });
    }

    // Check if expired
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry <= today) {
        notifications.push({
          title: "🚨 Expired Medicine Alert",
          body: `${medicineName} has expired on ${expiry.toLocaleDateString()}`,
        });
      }
    }

    // Send all notifications
    if (notifications.length > 0) {
      const db = getFirestore();
      const snapshot = await db
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where("isActive", "==", true)
        .get();

      const sendPromises = [];

      for (const notification of notifications) {
        const payload = JSON.stringify({
          ...notification,
          icon: "/icon-192x192.png",
          url: `/inventory/medicine/${medicineId}`,
        });

        snapshot.docs.forEach((doc) => {
          const subscription = doc.data().subscription;
          sendPromises.push(
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

      await Promise.all(sendPromises);

      res.json({
        success: true,
        message: `Sent ${notifications.length} notification(s) to ${snapshot.size} subscribers`,
        notifications,
      });
    } else {
      res.json({ success: true, message: "No notifications needed" });
    }
  } catch (error) {
    console.error("Check stock error:", error);
    res.status(500).json({ error: "Failed to check stock" });
  }
};

export const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
