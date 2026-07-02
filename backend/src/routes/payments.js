import express from 'express';
import { 
  initializeSignupPayment, 
  verifyPaymentStatus,
  retryPayment
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initialize', authenticate, initializeSignupPayment);



router.get('/verify', authenticate, verifyPaymentStatus);
router.post('/retry', authenticate, retryPayment);

export default router;
