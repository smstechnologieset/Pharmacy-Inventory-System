import express from "express";
import {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { loadTenantContext } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

// GET /api/suppliers (public for now - just reads)
router.get("/", getAllSuppliers);

// 🔒 Write operations require auth
router.use(authenticate);
router.use(loadTenantContext);

// POST /api/suppliers
router.post("/", createSupplier);

// PATCH /api/suppliers/:supplierId
router.patch("/:supplierId", updateSupplier);

// DELETE /api/suppliers/:supplierId
router.delete("/:supplierId", deleteSupplier);

export default router;
