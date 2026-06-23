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
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { PHARMACIES_COLLECTION, USERS_COLLECTION } from "./collections";

export const createPharmacy = async (pharmacyData) => {
  try {
    const pharmacyRef = await addDoc(collection(db, PHARMACIES_COLLECTION), {
      name: pharmacyData.name,
      address: pharmacyData.address || "",
      phone: pharmacyData.phone || "",
      email: pharmacyData.email || "",
      adminUid: pharmacyData.adminUid || "", 
      adminId: pharmacyData.adminId || "",
      status: pharmacyData.status || "active", 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: pharmacyRef.id, ...pharmacyData };
  } catch (error) {
    console.error("Error creating pharmacy:", error);
    throw new Error(`Failed to create pharmacy: ${error.message}`);
  }
};

export const getAllPharmacies = async () => {
  try {
    const q = query(collection(db, PHARMACIES_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error loading pharmacies:", error);
    throw new Error(`Failed to load pharmacies: ${error.message}`);
  }
};

export const getPharmacyById = async (pharmacyId) => {
  try {
    const pharmacyDoc = await getDoc(doc(db, PHARMACIES_COLLECTION, pharmacyId));
    if (!pharmacyDoc.exists()) throw new Error("Pharmacy not found");
    return { id: pharmacyDoc.id, ...pharmacyDoc.data() };
  } catch (error) {
    console.error("Error fetching pharmacy:", error);
    throw new Error(`Failed to fetch pharmacy: ${error.message}`);
  }
};

export const updatePharmacy = async (pharmacyId, updates) => {
  try {
    const pharmacyDocRef = doc(db, PHARMACIES_COLLECTION, pharmacyId);
    await updateDoc(pharmacyDocRef, { ...updates, updatedAt: serverTimestamp() });
    return { id: pharmacyId, ...updates };
  } catch (error) {
    console.error("Error updating pharmacy:", error);
    throw new Error(`Failed to update pharmacy: ${error.message}`);
  }
};

export const updateUserStatusByPharmacyId = async (pharmacyId, status) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("pharmacyId", "==", pharmacyId),
      where("role", "==", "admin"),
    );
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map((d) =>
      updateDoc(doc(db, USERS_COLLECTION, d.id), {
        status,
        updatedAt: serverTimestamp(),
      }),
    );
    await Promise.all(updates);
  } catch (error) {
    console.error("Error updating user status:", error);
    throw new Error(`Failed to update user status: ${error.message}`);
  }
};
export const subscribeToPharmacyStats = (pharmacyId, callback) => {
    const q = doc(db, "pharmacyStats", pharmacyId);
    return onSnapshot(q, (doc) => {
      callback(
        doc.exists() ? doc.data() : { totalRevenue: 0, totalSalesCount: 0 },
      );
    });
  };
