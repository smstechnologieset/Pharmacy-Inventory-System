import express from "express";
import { completeRegistration, cancelRegistration } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Use verifyToken because the user doesn't have claims yet during signup
router.post("/complete-registration", verifyToken, completeRegistration);

// Cancel/rollback signup: deletes the Firebase Auth user + Firestore profile
// so the user can re-register with the same email later
router.delete("/cancel-registration", verifyToken, cancelRegistration);

export default router;
