import express from "express";
import { createStaff, disableStaff, enableStaff, hardDeleteStaff } from "../controllers/staffController.js";

const router = express.Router();

// POST /api/staff/create
router.post("/create", createStaff);
// POST /api/staff/disable/:userId
router.post( "/disable/:userId", disableStaff
  
);

// POST /api/staff/enable/:userId
router.post("/enable/:userId", enableStaff);

// DELETE /api/staff/hard-delete/:userId
router.delete("/hard-delete/:userId", hardDeleteStaff);

export default router;
