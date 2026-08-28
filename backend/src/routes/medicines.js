import express from "express";
import {
  getAllMedicines,
  getMedicineById,
  searchMedicinesByPrefix,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicineController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { loadTenantContext } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

// GET /api/medicines  (public — needed for POS lookup without write auth)
router.get("/", getAllMedicines);

// GET /api/medicines/search
router.get("/search", searchMedicinesByPrefix);

// GET /api/medicines/:medicineId
router.get("/:medicineId", getMedicineById);

// 🔒 All write operations require a valid logged-in user with an active subscription
router.use(authenticate);
router.use(loadTenantContext);

// POST /api/medicines
router.post("/", createMedicine);

// PATCH /api/medicines/:medicineId
router.patch("/:medicineId", updateMedicine);

// DELETE /api/medicines/:medicineId
router.delete("/:medicineId", deleteMedicine);

export default router;
