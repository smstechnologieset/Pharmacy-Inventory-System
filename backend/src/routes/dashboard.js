import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/stats/:pharmacyId
router.get("/stats/:pharmacyId", getDashboardStats);

export default router;
