import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";

const SUPPLIERS_COLLECTION = "suppliers";

const serializeSupplier = (docRef) => ({ id: docRef.id, ...docRef.data() });

const tenantCollection = (db, pharmacyId, collectionName) =>
  db.collection("pharmacies").doc(pharmacyId).collection(collectionName);

const findTenantDocById = async (db, collectionName, docId, pharmacyId) => {
  if (pharmacyId) {
    const tenantDoc = await tenantCollection(db, pharmacyId, collectionName)
      .doc(docId)
      .get();
    return tenantDoc.exists ? tenantDoc : null;
  }

  const snapshot = await db
    .collectionGroup(collectionName)
    .where(admin.firestore.FieldPath.documentId(), "==", docId)
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshot.docs[0];
};

export const getAllSuppliers = async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    const db = getFirestore();

    const suppliersQuery = pharmacyId
      ? tenantCollection(db, pharmacyId, SUPPLIERS_COLLECTION).where(
          "isDeleted",
          "==",
          false,
        )
      : db.collectionGroup(SUPPLIERS_COLLECTION).where("isDeleted", "==", false);

    const snapshot = await suppliersQuery.get();
    const suppliers = snapshot.docs.map(serializeSupplier);
    res.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { supplier, pharmacyId } = req.body;
    if (!supplier || !pharmacyId) {
      return res
        .status(400)
        .json({ error: "Supplier data and pharmacyId are required" });
    }

    const payload = {
      ...supplier,
      medicines: supplier.medicines || [],
      pharmacyId,
      isDeleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = getFirestore();
    const supplierRef = await tenantCollection(
      db,
      pharmacyId,
      SUPPLIERS_COLLECTION,
    ).add(payload);
    res.status(201).json({ id: supplierRef.id, ...payload });
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { pharmacyId } = req.query;
    const updates = req.body;

    if (!supplierId) {
      return res.status(400).json({ error: "Supplier ID is required" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Update payload is required" });
    }

    const updatePayload = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = getFirestore();
    const supplierDoc = await findTenantDocById(
      db,
      SUPPLIERS_COLLECTION,
      supplierId,
      pharmacyId,
    );

    if (!supplierDoc?.exists) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    await supplierDoc.ref.update(updatePayload);

    res.json({ id: supplierId, ...updates });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { pharmacyId } = req.query;
    if (!supplierId) {
      return res.status(400).json({ error: "Supplier ID is required" });
    }

    const db = getFirestore();
    const supplierDoc = await findTenantDocById(
      db,
      SUPPLIERS_COLLECTION,
      supplierId,
      pharmacyId,
    );

    if (!supplierDoc?.exists) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    await supplierDoc.ref.update({
      isDeleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ id: supplierId });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ error: error.message });
  }
};
