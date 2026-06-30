import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";
import { TIER_LIMITS } from "../config/subscriptionConfig.js";

const MEDICINES_COLLECTION = "medicines";

const serializeMedicine = (docRef) => ({ id: docRef.id, ...docRef.data() });

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

export const getAllMedicines = async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    const db = getFirestore();

    const medicinesQuery = pharmacyId
      ? tenantCollection(db, pharmacyId, MEDICINES_COLLECTION).where(
          "isDeleted",
          "==",
          false,
        )
      : db.collectionGroup(MEDICINES_COLLECTION).where("isDeleted", "==", false);

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
    const { pharmacyId } = req.query;
    if (!medicineId) {
      return res.status(400).json({ error: "Medicine ID is required" });
    }

    const db = getFirestore();
    const medicineDoc = await findTenantDocById(
      db,
      MEDICINES_COLLECTION,
      medicineId,
      pharmacyId,
    );

    if (!medicineDoc?.exists) {
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

    let medicineQuery = (pharmacyId
      ? tenantCollection(db, pharmacyId, MEDICINES_COLLECTION)
      : db.collectionGroup(MEDICINES_COLLECTION))
      .where("isDeleted", "==", false)
      .where("name", ">=", normalizedPrefix)
      .where("name", "<=", endPrefix)
      .limit(20);

    const snapshot = await medicineQuery.get();
    const medicines = snapshot.docs.map(serializeMedicine);
    res.json(medicines);
  } catch (error) {
    console.error("Error searching medicines by prefix:", error);
    res.status(500).json({ error: error.message });
  }
};

// export const createMedicine = async (req, res) => {
//   try {
//     const { medicine, pharmacyId } = req.body;
//     if (!medicine || !pharmacyId) {
//       return res
//         .status(400)
//         .json({ error: "Medicine data and pharmacyId are required" });
//     }

//     const payload = {
//       ...medicine,
//       stock: Number(medicine.stock || 0),
//       price: Number(medicine.price || 0),
//       pharmacyId,
//       isDeleted: false,
//       totalStock: Number(medicine.totalStock || 0),
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//     };

//     const db = getFirestore();
//     const medicineRef = await tenantCollection(
//       db,
//       pharmacyId,
//       MEDICINES_COLLECTION,
//     ).add(payload);
//     res.status(201).json({ id: medicineRef.id, ...payload });
//   } catch (error) {
//     console.error("Error creating medicine:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

export const createMedicine = async (req, res) => {
  try {
    // 🔒 SECURITY: Get pharmacyId from the verified token, NOT the request body
    const pharmacyId = req.tenant.id;
    const { medicine } = req.body;

    if (!medicine) {
      return res.status(400).json({ error: "Medicine data is required" });
    }

    const db = getFirestore();
    const pharmacyRef = db.collection("pharmacies").doc(pharmacyId);
    const medicinesRef = db
      .collection("pharmacies")
      .doc(pharmacyId)
      .collection("medicines");

    // 🛡️ USE A TRANSACTION to check quota and create medicine atomically
    const result = await db.runTransaction(async (transaction) => {
      const pharmacyDoc = await transaction.get(pharmacyRef);

      if (!pharmacyDoc.exists) throw new Error("Pharmacy not found");

      const pharmacyData = pharmacyDoc.data();
      const currentSkuCount = pharmacyData.usageMetrics?.currentSkuCount || 0;
      const tier = pharmacyData.subscription?.tier || "starter_fikir";
      const limits = TIER_LIMITS[tier];

      // 1. CHECK QUOTA INSIDE TRANSACTION
      if (currentSkuCount >= limits.maxSkus) {
        throw new Error("SKU_LIMIT_REACHED");
      }

      // 2. CREATE THE MEDICINE
      const newMedicineRef = medicinesRef.doc();
      const payload = {
        ...medicine,
        stock: Number(medicine.stock || 0),
        price: Number(medicine.price || 0),
        totalStock: Number(medicine.totalStock || 0),
        pharmacyId, // Enforce tenant ID
        isDeleted: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(newMedicineRef, payload);

      // 3. INCREMENT THE SKU COUNT
      transaction.update(pharmacyRef, {
        "usageMetrics.currentSkuCount": currentSkuCount + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { id: newMedicineRef.id, ...payload };
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.message === "SKU_LIMIT_REACHED") {
      return res.status(402).json({
        error: "Medicine limit reached",
        message:
          "Your current plan does not allow more medicines. Please upgrade to add more SKUs.",
      });
    }
    console.error("Error creating medicine:", error);
    res.status(500).json({ error: error.message });
  }
};
export const updateMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { pharmacyId } = req.query;
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
    const medicineDoc = await findTenantDocById(
      db,
      MEDICINES_COLLECTION,
      medicineId,
      pharmacyId,
    );

    if (!medicineDoc?.exists) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    await medicineDoc.ref.update(updatePayload);

    res.json({ id: medicineId, ...updatePayload });
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { pharmacyId } = req.query;
    if (!medicineId) {
      return res.status(400).json({ error: "Medicine ID is required" });
    }

    const db = getFirestore();
    const medicineDoc = await findTenantDocById(
      db,
      MEDICINES_COLLECTION,
      medicineId,
      pharmacyId,
    );

    if (!medicineDoc?.exists) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    await medicineDoc.ref.update({
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
