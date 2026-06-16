import {
  doc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { SUPPLIERS_COLLECTION } from "./collections";

export const createSupplier = async (supplier, pharmacyId) => {
  try {
    const supplierRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), {
      ...supplier,
      medicines: supplier.medicines || [],
      pharmacyId,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: supplierRef.id, ...supplier };
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw new Error(`Failed to create supplier: ${error.message}`);
  }
};

export const getAllSuppliers = async (pharmacyId) => {
  try {
    const supplierQuery = pharmacyId
      ? query(collection(db, SUPPLIERS_COLLECTION), where("pharmacyId", "==", pharmacyId), where("isDeleted", "==", false))
      : query(collection(db, SUPPLIERS_COLLECTION), where("isDeleted", "==", false));
    const snapshot = await getDocs(supplierQuery);
    return snapshot.docs.map((docRef) => ({ id: docRef.id, ...docRef.data() }));
  } catch (error) {
    console.error("Error loading suppliers:", error);
    throw new Error(`Failed to load suppliers: ${error.message}`);
  }
};

export const updateSupplier = async (supplierId, updates) => {
  try {
    const supplierDocRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    await updateDoc(supplierDocRef, { ...updates, updatedAt: serverTimestamp() });
    return { id: supplierId, ...updates };
  } catch (error) {
    console.error("Error updating supplier:", error);
    throw new Error(`Failed to update supplier: ${error.message}`);
  }
};

export const deleteSupplier = async (supplierId) => {
  try {
    const supplierRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    await updateDoc(supplierRef, { isDeleted: true, deletedAt: serverTimestamp() });
    return supplierId;
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw new Error(`Failed to delete supplier: ${error.message}`);
  }
};
