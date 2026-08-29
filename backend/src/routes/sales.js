import express from "express";
import { createSale, getAllSales, getRecentSales, getSalesByDateRange } from "../controllers/saleController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { loadTenantContext } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

// 🔒 PROTECT ALL ROUTES
router.use(authenticate);
router.use(loadTenantContext);

router.post("/", createSale);
router.get("/", getAllSales);
router.get("/recent", getRecentSales);
router.get("/date-range", getSalesByDateRange);
router.get("/range", getSalesByDateRange);

export default router;
