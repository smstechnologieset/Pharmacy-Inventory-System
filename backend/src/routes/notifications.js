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
