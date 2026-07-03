import express from "express";
import { completeRegistration } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // <--- Change this

const router = express.Router();

// Use verifyToken because the user doesn't have claims yet during signup
router.post("/complete-registration", verifyToken, completeRegistration);

export default router;
