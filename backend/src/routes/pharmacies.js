import express from "express";
import {
  getAllPharmacies,
  getPharmacyById,
  createPharmacy,
  updatePharmacy,
  updateUserStatusByPharmacyId,
} from "../controllers/pharmacyController.js";

const router = express.Router();

// GET /api/pharmacies
router.get("/", getAllPharmacies);

// GET /api/pharmacies/:pharmacyId
router.get("/:pharmacyId", getPharmacyById);

// POST /api/pharmacies
router.post("/", createPharmacy);

// PATCH /api/pharmacies/:pharmacyId
router.patch("/:pharmacyId", updatePharmacy);

// PATCH /api/pharmacies/:pharmacyId/user-status
router.patch("/:pharmacyId/user-status", updateUserStatusByPharmacyId);

export default router;
