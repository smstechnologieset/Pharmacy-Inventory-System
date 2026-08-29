import express from 'express';
import { initializeSignupPayment, verifyPaymentStatus, retryPayment } from '../controllers/paymentController.js';
import { handleChapaWebhook } from '../controllers/subscriptionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getChapaReturnUrl } from '../config/chapa.js';

const router = express.Router();

// 🟢 Webhook routes (Public - no auth)
router.post('/webhook', handleChapaWebhook);
router.get('/webhook', (req, res) => {
  const txRef = req.query.tx_ref || req.query.trx_ref || '';
  const returnUrl = getChapaReturnUrl();
  const sep = returnUrl.includes('?') ? '&' : '?';
  const target = txRef ? `${returnUrl}${sep}tx_ref=${encodeURIComponent(txRef)}` : returnUrl;
  return res.redirect(302, target);
});

// 🟢 Authenticated payment routes
router.post('/initialize', verifyToken, initializeSignupPayment);
router.get('/verify', verifyToken, verifyPaymentStatus);
router.post('/retry', verifyToken, retryPayment);

export default router;
