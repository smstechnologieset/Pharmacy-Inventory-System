import express from 'express';
import { initializeSignupPayment, verifyPaymentStatus, retryPayment } from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; // <--- Change this

const router = express.Router();

// Apply verifyToken to payment routes
router.post('/initialize', verifyToken, initializeSignupPayment);
router.get('/verify', verifyToken, verifyPaymentStatus);
router.post('/retry', verifyToken, retryPayment);

export default router;
