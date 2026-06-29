import express from "express";
import {
  getAllMedicines,
  getMedicineById,
  searchMedicinesByPrefix,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicineController.js";

const router = express.Router();

// GET /api/medicines
router.get("/", getAllMedicines);

// GET /api/medicines/search
router.get("/search", searchMedicinesByPrefix);

// GET /api/medicines/:medicineId
router.get("/:medicineId", getMedicineById);

// POST /api/medicines
router.post("/", createMedicine);

// PATCH /api/medicines/:medicineId
router.patch("/:medicineId", updateMedicine);

// DELETE /api/medicines/:medicineId
router.delete("/:medicineId", deleteMedicine);

export default router;
