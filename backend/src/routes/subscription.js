import express from "express";
import { getSubscriptionStatus, upgradeSubscription } from "../controllers/subscriptionController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { loadTenantContext } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

// All subscription routes require authentication and tenant context
router.use(authenticate);
router.use(loadTenantContext);

router.get("/status", getSubscriptionStatus);
router.post("/upgrade", upgradeSubscription);

export default router;
