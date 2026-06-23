import {
  doc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { MEDICINES_COLLECTION } from "./collections";

export const createMedicine = async (medicine, pharmacyId) => {
  try {
    const medicineRef = await addDoc(collection(db, MEDICINES_COLLECTION), {
      ...medicine,
      stock: Number(medicine.stock),
      price: Number(medicine.price),
      pharmacyId,
      isDeleted: false,
      totalStock: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: medicineRef.id, ...medicine };
  } catch (error) {
    console.error("Error creating medicine:", error);
    throw new Error(`Failed to create medicine: ${error.message}`);
  }
};

export const getAllMedicines = async (pharmacyId) => {
  try {
    const medicineQuery = pharmacyId
      ? query(collection(db, MEDICINES_COLLECTION), where("pharmacyId", "==", pharmacyId), where("isDeleted", "==", false))
      : query(collection(db, MEDICINES_COLLECTION), where("isDeleted", "==", false));
    const snapshot = await getDocs(medicineQuery);
    return snapshot.docs.map((docRef) => ({ id: docRef.id, ...docRef.data() }));
  } catch (error) {
    console.error("Error loading medicines:", error);
    throw new Error(`Failed to load medicines: ${error.message}`);
  }
};

export const getMedicineById = async (medicineId) => {
  try {
    const medicineDoc = await getDoc(doc(db, MEDICINES_COLLECTION, medicineId));
    if (!medicineDoc.exists()) throw new Error("Medicine not found");
    return { id: medicineDoc.id, ...medicineDoc.data() };
  } catch (error) {
    console.error("Error fetching medicine:", error);
    throw new Error(`Failed to fetch medicine: ${error.message}`);
  }
};

export const searchMedicinesByPrefix = async (pharmacyId, prefix) => {
  if (!prefix || prefix.length === 0) return [];
  try {
    const endPrefix = prefix + "\uf8ff";
    const baseQuery = pharmacyId
      ? query(collection(db, MEDICINES_COLLECTION), where("pharmacyId", "==", pharmacyId), where("isDeleted", "==", false), where("name", ">=", prefix), where("name", "<=", endPrefix), limit(20))
      : query(collection(db, MEDICINES_COLLECTION), where("isDeleted", "==", false), where("name", ">=", prefix), where("name", "<=", endPrefix), limit(20));

    const snapshot = await getDocs(baseQuery);
    return snapshot.docs.map((docRef) => ({ id: docRef.id, ...docRef.data() }));
  } catch (error) {
    console.error("Error searching medicines:", error);
    throw new Error(`Failed to search medicines: ${error.message}`);
  }
};

export const updateMedicine = async (medicineId, updates) => {
  try {
    const medicineDocRef = doc(db, MEDICINES_COLLECTION, medicineId);
    const updatePayload = { updatedAt: serverTimestamp() };

    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.price !== undefined) updatePayload.price = Number(updates.price);
    if (updates.stock !== undefined) updatePayload.stock = Number(updates.stock);
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.batch !== undefined) updatePayload.batch = updates.batch;
    if (updates.expiry !== undefined) updatePayload.expiry = updates.expiry;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.supplierId !== undefined) updatePayload.supplierId = updates.supplierId;
    if (updates.supplierName !== undefined) updatePayload.supplierName = updates.supplierName;
    
    await updateDoc(medicineDocRef, updatePayload);
    return { id: medicineId, ...updates };
  } catch (error) {
    console.error("Error updating medicine:", error);
    throw new Error(`Failed to update medicine: ${error.message}`);
  }
};

export const deleteMedicine = async (medicineId) => {
  try {
    const medicineRef = doc(db, MEDICINES_COLLECTION, medicineId);
    await updateDoc(medicineRef, { isDeleted: true, deletedAt: serverTimestamp() });
    return medicineId;
  } catch (error) {
    console.error("Error deleting medicine:", error);
    throw new Error(`Failed to delete medicine: ${error.message}`);
  }
};


export const subscribeToMedicines = (pharmacyId, callback) => {
  const q = pharmacyId
    ? query(collection(db, MEDICINES_COLLECTION), where("pharmacyId", "==", pharmacyId), where("isDeleted", "==", false))
    : query(collection(db, MEDICINES_COLLECTION), where("isDeleted", "==", false));

  return onSnapshot(
    q,
    (snapshot) => {
      const medicines = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(medicines);
    },
    (error) => {
      console.error("Error in medicines subscription:", error);
    }
  );
};
