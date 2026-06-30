import express from "express";
import { completeRegistration } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// This route requires the user to be logged in (Step 1), but bypasses the pharmacyId check
router.post("/complete-registration", authenticate, completeRegistration);

export default router;
