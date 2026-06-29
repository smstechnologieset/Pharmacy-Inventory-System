import express from "express";
import {
  createSale,
  getAllSales,
  getRecentSales,
  getSalesByDateRange,
} from "../controllers/saleController.js";

const router = express.Router();

// GET /api/sales/recent
router.get("/recent", getRecentSales);

// GET /api/sales/range
router.get("/range", getSalesByDateRange);

// GET /api/sales
router.get("/", getAllSales);

// POST /api/sales
router.post("/", createSale);

export default router;
