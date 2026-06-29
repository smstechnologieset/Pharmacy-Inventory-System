import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";

const MEDICINES_COLLECTION = "medicines";

const serializeMedicine = (docRef) => ({ id: docRef.id, ...docRef.data() });

export const getAllMedicines = async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    const db = getFirestore();

    let medicinesQuery = db
      .collection(MEDICINES_COLLECTION)
      .where("isDeleted", "==", false);

    if (pharmacyId) {
      medicinesQuery = medicinesQuery.where("pharmacyId", "==", pharmacyId);
    }

    const snapshot = await medicinesQuery.get();
    const medicines = snapshot.docs.map(serializeMedicine);
    res.json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const { medicineId } = req.params;
    if (!medicineId) {
      return res.status(400).json({ error: "Medicine ID is required" });
    }

    const db = getFirestore();
    const medicineDoc = await db
      .collection(MEDICINES_COLLECTION)
      .doc(medicineId)
      .get();

    if (!medicineDoc.exists) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    if (medicineDoc.data().isDeleted) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    res.json(serializeMedicine(medicineDoc));
  } catch (error) {
    console.error("Error fetching medicine by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

export const searchMedicinesByPrefix = async (req, res) => {
  try {
    const { pharmacyId, prefix } = req.query;
    if (!prefix || prefix.trim().length === 0) {
      return res.json([]);
    }

    const normalizedPrefix = prefix.trim();
    const endPrefix = `${normalizedPrefix}\uf8ff`;
    const db = getFirestore();

    let medicineQuery = db
      .collection(MEDICINES_COLLECTION)
      .where("isDeleted", "==", false)
      .where("name", ">=", normalizedPrefix)
      .where("name", "<=", endPrefix)
      .limit(20);

    if (pharmacyId) {
      medicineQuery = medicineQuery.where("pharmacyId", "==", pharmacyId);
    }

    const snapshot = await medicineQuery.get();
    const medicines = snapshot.docs.map(serializeMedicine);
    res.json(medicines);
  } catch (error) {
    console.error("Error searching medicines by prefix:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const { medicine, pharmacyId } = req.body;
    if (!medicine || !pharmacyId) {
      return res
        .status(400)
        .json({ error: "Medicine data and pharmacyId are required" });
    }

    const payload = {
      ...medicine,
      stock: Number(medicine.stock || 0),
      price: Number(medicine.price || 0),
      pharmacyId,
      isDeleted: false,
      totalStock: Number(medicine.totalStock || 0),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = getFirestore();
    const medicineRef = await db.collection(MEDICINES_COLLECTION).add(payload);
    res.status(201).json({ id: medicineRef.id, ...payload });
  } catch (error) {
    console.error("Error creating medicine:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const updates = req.body;

    if (!medicineId) {
      return res.status(400).json({ error: "Medicine ID is required" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Update payload is required" });
    }

    const updatePayload = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.category !== undefined)
      updatePayload.category = updates.category;
    if (updates.price !== undefined)
      updatePayload.price = Number(updates.price);
    if (updates.stock !== undefined)
      updatePayload.stock = Number(updates.stock);
    if (updates.description !== undefined)
      updatePayload.description = updates.description;
    if (updates.batch !== undefined) updatePayload.batch = updates.batch;
    if (updates.expiry !== undefined) updatePayload.expiry = updates.expiry;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.supplierId !== undefined)
      updatePayload.supplierId = updates.supplierId;
    if (updates.supplierName !== undefined)
      updatePayload.supplierName = updates.supplierName;
    if (updates.totalStock !== undefined)
      updatePayload.totalStock = Number(updates.totalStock);

    const db = getFirestore();
    await db
      .collection(MEDICINES_COLLECTION)
      .doc(medicineId)
      .update(updatePayload);

    res.json({ id: medicineId, ...updatePayload });
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    if (!medicineId) {
      return res.status(400).json({ error: "Medicine ID is required" });
    }

    const db = getFirestore();
    await db.collection(MEDICINES_COLLECTION).doc(medicineId).update({
      isDeleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ id: medicineId });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({ error: error.message });
  }
};
