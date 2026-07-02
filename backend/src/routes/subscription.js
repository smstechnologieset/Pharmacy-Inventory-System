import express from "express";
import { 
  getSubscriptionStatus, 
  upgradeSubscription,
  initiateSubscription,
  handleChapaWebhook
} from "../controllers/subscriptionController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { loadTenantContext } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

// 🟢 Public route for Chapa Webhook (No auth required)
router.post("/webhook", handleChapaWebhook);

// 🟢 Authenticated routes
router.use(authenticate);

// Initiate subscription (Requires auth, but NOT tenant context yet)
router.post("/initiate", initiateSubscription);

// Routes that require full tenant context
router.use(loadTenantContext);
router.get("/status", getSubscriptionStatus);
router.post("/upgrade", upgradeSubscription);

export default router;
