import express from "express";
import {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";

const router = express.Router();

// GET /api/suppliers
router.get("/", getAllSuppliers);

// POST /api/suppliers
router.post("/", createSupplier);

// PATCH /api/suppliers/:supplierId
router.patch("/:supplierId", updateSupplier);

// DELETE /api/suppliers/:supplierId
router.delete("/:supplierId", deleteSupplier);

export default router;
