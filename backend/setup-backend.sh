#!/bin/bash

echo "🚀 Setting up Pharmacy Inventory Backend..."

# Create backend folder if it doesn't exist




# Create src/index.js
cat > src/index.js << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase.js';
import notificationRoutes from './routes/notifications.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
initializeFirebase();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pharmacy Inventory Backend is running' });
});

// Routes
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
EOF

# Create src/config/firebase.js
cat > src/config/firebase.js << 'EOF'
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

export const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase Admin SDK initialization failed:', error);
      throw error;
    }
  }
  return admin;
};

export const getFirestore = () => admin.firestore();
EOF

# Create src/config/webPush.js
cat > src/config/webPush.js << 'EOF'
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

export const initializeWebPush = () => {
  const vapidDetails = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || 'mailto:your-email@example.com',
  };

  webpush.setVapidDetails(
    vapidDetails.subject,
    vapidDetails.publicKey,
    vapidDetails.privateKey
  );

  console.log('✅ Web Push VAPID keys configured');
  return webpush;
};

export { webpush };
EOF

# Create src/routes/notifications.js
cat > src/routes/notifications.js << 'EOF'
import express from 'express';
import { subscribe, unsubscribe, sendNotification, checkStockAndNotify } from '../controllers/notificationController.js';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', unsubscribe);

// Send notification to all subscribers
router.post('/send', sendNotification);

// Check stock levels and send notifications if needed
router.post('/check-stock', checkStockAndNotify);

export default router;
EOF

# Create src/controllers/notificationController.js
cat > src/controllers/notificationController.js << 'EOF'
import { getFirestore } from '../config/firebase.js';
import { webpush } from '../config/webPush.js';

const SUBSCRIPTIONS_COLLECTION = 'push_subscriptions';

// Subscribe to push notifications
export const subscribe = async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    const db = getFirestore();
    const subscriptionId = `${userId}_${Date.now()}`;
    
    await db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscriptionId).set({
      userId: userId || 'anonymous',
      subscription,
      createdAt: new Date().toISOString(),
      isActive: true,
    });

    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

// Unsubscribe from push notifications
export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    const db = getFirestore();
    const subscriptionsRef = db.collection(SUBSCRIPTIONS_COLLECTION);
    const snapshot = await subscriptionsRef.where('subscription.endpoint', '==', endpoint).get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });
    await batch.commit();

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

// Send notification to all active subscribers
export const sendNotification = async (req, res) => {
  try {
    const { title, body, icon, url } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const db = getFirestore();
    const snapshot = await db.collection(SUBSCRIPTIONS_COLLECTION)
      .where('isActive', '==', true)
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, message: 'No active subscribers' });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192x192.png',
      url: url || '/',
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
      message: `Notification sent to ${snapshot.size} subscribers` 
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Check stock levels and send notifications
export const checkStockAndNotify = async (req, res) => {
  try {
    const { medicineId, medicineName, quantity, minStock, expiryDate } = req.body;
    
    if (!medicineId || !medicineName || quantity === undefined) {
      return res.status(400).json({ error: 'Medicine details are required' });
    }

    const notifications = [];
    const today = new Date();

    // Check if out of stock
    if (quantity === 0) {
      notifications.push({
        title: '⚠️ Out of Stock Alert',
        body: `${medicineName} is now out of stock!`,
      });
    }
    // Check if low stock
    else if (minStock && quantity <= minStock) {
      notifications.push({
        title: '📉 Low Stock Alert',
        body: `${medicineName} has only ${quantity} units left (minimum: ${minStock})`,
      });
    }

    // Check if expired
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry <= today) {
        notifications.push({
          title: '🚨 Expired Medicine Alert',
          body: `${medicineName} has expired on ${expiry.toLocaleDateString()}`,
        });
      }
    }

    // Send all notifications
    if (notifications.length > 0) {
      const db = getFirestore();
      const snapshot = await db.collection(SUBSCRIPTIONS_COLLECTION)
        .where('isActive', '==', true)
        .get();

      const sendPromises = [];
      
      for (const notification of notifications) {
        const payload = JSON.stringify({
          ...notification,
          icon: '/icon-192x192.png',
          url: `/inventory/medicine/${medicineId}`,
        });

        snapshot.docs.forEach((doc) => {
          const subscription = doc.data().subscription;
          sendPromises.push(
            webpush.sendNotification(subscription, payload).catch(async (error) => {
              if (error.statusCode === 410) {
                await db.collection(SUBSCRIPTIONS_COLLECTION).doc(doc.id).update({
                  isActive: false,
                });
              }
            })
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
      res.json({ success: true, message: 'No notifications needed' });
    }
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({ error: 'Failed to check stock' });
  }
};
EOF

# Create src/middleware/errorHandler.js
cat > src/middleware/errorHandler.js << 'EOF'
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
EOF

# Create src/utils/generateVapidKeys.js
cat > src/utils/generateVapidKeys.js << 'EOF'
import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔑 VAPID Keys Generated Successfully!\n');
console.log('Add these to your backend/.env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\n⚠️  Keep your private key secure and never share it!\n');
EOF

# Create README.md
cat > README.md << 'EOF'
# Pharmacy Inventory Backend

Backend API for the Pharmacy Inventory System with Web Push Notifications.

## Setup

1. Install dependencies:
```bash
npm install
EOF
