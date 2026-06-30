import express from "express";
import { createStaff, disableStaff, enableStaff, hardDeleteStaff, updateStaff } from "../controllers/staffController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { loadTenantContext } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

// 🔒 PROTECT ALL ROUTES: Verify token and load pharmacy context
router.use(authenticate);
router.use(loadTenantContext);

// POST /api/staff/create
router.post("/create", createStaff);

// POST /api/staff/disable/:userId
router.post("/disable/:userId", disableStaff);

// POST /api/staff/enable/:userId
router.post("/enable/:userId", enableStaff);

// DELETE /api/staff/hard-delete/:userId
router.delete("/hard-delete/:userId", hardDeleteStaff);


router.patch("/:userId", updateStaff);


export default router;
