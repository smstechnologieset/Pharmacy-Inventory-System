import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const USERS_COLLECTION = "users";
const MEDICINES_COLLECTION = "medicines";
const SUPPLIERS_COLLECTION = "suppliers";
const SALES_COLLECTION = "sales";

/**
 * Create a new medicine document in Firestore
 */
export const createMedicine = async (medicine) => {
  try {
    const medicineRef = await addDoc(collection(db, MEDICINES_COLLECTION), {
      ...medicine,
      stock: Number(medicine.stock),
      price: Number(medicine.price),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: medicineRef.id, ...medicine };
  } catch (error) {
    console.error("Error creating medicine:", error);
    throw new Error(`Failed to create medicine: ${error.message}`);
  }
};

/**
 * Get all medicines from Firestore
 */
export const getAllMedicines = async () => {
  try {
    const medicineQuery = query(collection(db, MEDICINES_COLLECTION));
    const snapshot = await getDocs(medicineQuery);
    return snapshot.docs.map((docRef) => ({ id: docRef.id, ...docRef.data() }));
  } catch (error) {
    console.error("Error loading medicines:", error);
    throw new Error(`Failed to load medicines: ${error.message}`);
  }
};

/**
 * Get a single medicine by ID
 */
export const getMedicineById = async (medicineId) => {
  try {
    const medicineDoc = await getDoc(doc(db, MEDICINES_COLLECTION, medicineId));
    if (!medicineDoc.exists()) {
      throw new Error("Medicine not found");
    }
    return { id: medicineDoc.id, ...medicineDoc.data() };
  } catch (error) {
    console.error("Error fetching medicine:", error);
    throw new Error(`Failed to fetch medicine: ${error.message}`);
  }
};

/**
 * Update a medicine document in Firestore
 */
export const updateMedicine = async (medicineId, updates) => {
  try {
    const medicineDocRef = doc(db, MEDICINES_COLLECTION, medicineId);
    const updatePayload = {
      updatedAt: serverTimestamp(),
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

    await updateDoc(medicineDocRef, updatePayload);
    return { id: medicineId, ...updates };
  } catch (error) {
    console.error("Error updating medicine:", error);
    throw new Error(`Failed to update medicine: ${error.message}`);
  }
};

/**
 * Delete a medicine document from Firestore
 */
export const deleteMedicine = async (medicineId) => {
  try {
    await deleteDoc(doc(db, MEDICINES_COLLECTION, medicineId));
    return medicineId;
  } catch (error) {
    console.error("Error deleting medicine:", error);
    throw new Error(`Failed to delete medicine: ${error.message}`);
  }
};

/**
 * Create a new supplier document in Firestore
 */
export const createSupplier = async (supplier) => {
  try {
    const supplierRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), {
      ...supplier,
      medicines: supplier.medicines || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: supplierRef.id, ...supplier };
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw new Error(`Failed to create supplier: ${error.message}`);
  }
};

/**
 * Get all suppliers from Firestore
 */
export const getAllSuppliers = async () => {
  try {
    const supplierQuery = query(collection(db, SUPPLIERS_COLLECTION));
    const snapshot = await getDocs(supplierQuery);
    return snapshot.docs.map((docRef) => ({ id: docRef.id, ...docRef.data() }));
  } catch (error) {
    console.error("Error loading suppliers:", error);
    throw new Error(`Failed to load suppliers: ${error.message}`);
  }
};

/**
 * Update a supplier document in Firestore
 */
export const updateSupplier = async (supplierId, updates) => {
  try {
    const supplierDocRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    const updatePayload = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(supplierDocRef, updatePayload);
    return { id: supplierId, ...updates };
  } catch (error) {
    console.error("Error updating supplier:", error);
    throw new Error(`Failed to update supplier: ${error.message}`);
  }
};

/**
 * Delete a supplier document from Firestore
 */
export const deleteSupplier = async (supplierId) => {
  try {
    await deleteDoc(doc(db, SUPPLIERS_COLLECTION, supplierId));
    return supplierId;
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw new Error(`Failed to delete supplier: ${error.message}`);
  }
};

/**
 * Create a new sales transaction in Firestore
 */
export const createSale = async (sale) => {
  try {
    const saleRef = await addDoc(collection(db, SALES_COLLECTION), {
      ...sale,
      quantity: Number(sale.quantity),
      amount: Number(sale.amount),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: saleRef.id, ...sale };
  } catch (error) {
    console.error("Error creating sale:", error);
    throw new Error(`Failed to create sale: ${error.message}`);
  }
};

/**
 * Get all sales from Firestore
 */
export const getAllSales = async () => {
  try {
    const salesQuery = query(
      collection(db, SALES_COLLECTION),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(salesQuery);
    return snapshot.docs.map((docRef) => ({ id: docRef.id, ...docRef.data() }));
  } catch (error) {
    console.error("Error loading sales:", error);
    throw new Error(`Failed to load sales: ${error.message}`);
  }
};

/**
 * Create a new user profile in Firestore
 * Called after successful Firebase Authentication signup
 */

export const createUserProfile = async (uid, userData) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);

    const profileData = {
      uid,
      email: userData.email,
      name: userData.name || "",
      role: userData.role || "staff", // 'admin', 'pharmacist', 'manager', 'staff'
      avatar: userData.avatar || `https://i.pravatar.cc/150?u=${uid}`,
      status: "Active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, profileData);
    return profileData;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error("User profile not found");
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw new Error(`Failed to retrieve user profile: ${error.message}`);
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userDocRef, updateData);
    return updateData;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

/**
 * Get user by email (for checking if user exists)
 */
export const getUserByEmail = async (email) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", email),
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error("Error querying user by email:", error);
    throw new Error(`Failed to query user: ${error.message}`);
  }
};

/**
 * Get all users (for staff management)
 */
export const getAllUsers = async () => {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error getting all users:", error);
    throw new Error(`Failed to retrieve users: ${error.message}`);
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("role", "==", role),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error getting users by role:", error);
    throw new Error(`Failed to retrieve users by role: ${error.message}`);
  }
};
