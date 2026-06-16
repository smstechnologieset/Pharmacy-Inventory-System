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
  runTransaction,
  increment,
  limit,
  startAfter,
  onSnapshot,
  getCountFromServer,
  getAggregateFromServer,
  sum,
} from "firebase/firestore";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { db, firebaseConfig } from "./firebase";
import { getApps, initializeApp } from "firebase/app";

const USERS_COLLECTION = "users";
const MEDICINES_COLLECTION = "medicines";
const SUPPLIERS_COLLECTION = "suppliers";
const SALES_COLLECTION = "sales";
const STOCK_BATCHES_COLLECTION = "stockBatches";
const PHARMACIES_COLLECTION = "pharmacies";

// ═══════════════════════════════════════════════════════════════
// PHARMACY CRUD (Super Admin only)
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new pharmacy document
 */
export const createPharmacy = async (pharmacyData) => {
  try {
    const pharmacyRef = await addDoc(collection(db, PHARMACIES_COLLECTION), {
      name: pharmacyData.name,
      address: pharmacyData.address || "",
      phone: pharmacyData.phone || "",
      email: pharmacyData.email || "",
      adminUid: pharmacyData.adminUid || "", // required by Firestore rule
      adminId: pharmacyData.adminId || "",
      status: pharmacyData.status || "active", // allow 'pending' to be passed in
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: pharmacyRef.id, ...pharmacyData };
  } catch (error) {
    console.error("Error creating pharmacy:", error);
    throw new Error(`Failed to create pharmacy: ${error.message}`);
  }
};

/**
 * Get all pharmacies (Super Admin)
 */
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

/**
 * Get a single pharmacy by ID
 */
export const getPharmacyById = async (pharmacyId) => {
  try {
    const pharmacyDoc = await getDoc(
      doc(db, PHARMACIES_COLLECTION, pharmacyId),
    );
    if (!pharmacyDoc.exists()) throw new Error("Pharmacy not found");
    return { id: pharmacyDoc.id, ...pharmacyDoc.data() };
  } catch (error) {
    console.error("Error fetching pharmacy:", error);
    throw new Error(`Failed to fetch pharmacy: ${error.message}`);
  }
};

/**
 * Update a pharmacy (e.g., suspend/enable, edit details)
 */
export const updatePharmacy = async (pharmacyId, updates) => {
  try {
    const pharmacyDocRef = doc(db, PHARMACIES_COLLECTION, pharmacyId);
    await updateDoc(pharmacyDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { id: pharmacyId, ...updates };
  } catch (error) {
    console.error("Error updating pharmacy:", error);
    throw new Error(`Failed to update pharmacy: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// MEDICINE CRUD (Pharmacy-scoped)
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new medicine document in Firestore
 */
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

/**
 * Get all medicines from Firestore (scoped to pharmacy)
 */
export const getAllMedicines = async (pharmacyId) => {
  try {
    const medicineQuery = pharmacyId
      ? query(
          collection(db, MEDICINES_COLLECTION),
          where("pharmacyId", "==", pharmacyId),
          where("isDeleted", "==", false),
        )
      : query(
          collection(db, MEDICINES_COLLECTION),
          where("isDeleted", "==", false),
        );
    const snapshot = await getDocs(medicineQuery);
    return snapshot.docs.map((docRef) => ({
      id: docRef.id,
      ...docRef.data(),
    }));
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
 * Search medicines by name prefix (native Firestore server-side search)
 */
export const searchMedicinesByPrefix = async (pharmacyId, prefix) => {
  if (!prefix || prefix.length === 0) return [];
  try {
    const endPrefix = prefix + "\uf8ff";
    let baseQuery;

    if (pharmacyId) {
      baseQuery = query(
        collection(db, MEDICINES_COLLECTION),
        where("pharmacyId", "==", pharmacyId),
        where("isDeleted", "==", false),
        where("name", ">=", prefix),
        where("name", "<=", endPrefix),
        limit(20),
      );
    } else {
      baseQuery = query(
        collection(db, MEDICINES_COLLECTION),
        where("isDeleted", "==", false),
        where("name", ">=", prefix),
        where("name", "<=", endPrefix),
        limit(20),
      );
    }

    const snapshot = await getDocs(baseQuery);
    return snapshot.docs.map((docRef) => ({
      id: docRef.id,
      ...docRef.data(),
    }));
  } catch (error) {
    console.error("Error searching medicines:", error);
    throw new Error(`Failed to search medicines: ${error.message}`);
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
    if (updates.supplierId !== undefined)
      updatePayload.supplierId = updates.supplierId;
    //supplier name persistence.
    if (updates.supplierName !== undefined)
      updatePayload.supplierName = updates.supplierName;
    await updateDoc(medicineDocRef, updatePayload);
    return { id: medicineId, ...updates };
  } catch (error) {
    console.error("Error updating medicine:", error);
    throw new Error(`Failed to update medicine: ${error.message}`);
  }
};
// Requested fix

/**
 * Delete a medicine document from Firestore
 */
export const deleteMedicine = async (medicineId) => {
  try {
    const medicineRef = doc(db, MEDICINES_COLLECTION, medicineId);
    await updateDoc(medicineRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });
    return medicineId;
  } catch (error) {
    console.error("Error deleting medicine:", error);
    throw new Error(`Failed to delete medicine: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// SUPPLIER CRUD (Pharmacy-scoped)
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new supplier document in Firestore
 */
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

/**
 * Get all suppliers from Firestore (scoped to pharmacy)
 */
export const getAllSuppliers = async (pharmacyId) => {
  try {
    const supplierQuery = pharmacyId
      ? query(
          collection(db, SUPPLIERS_COLLECTION),
          where("pharmacyId", "==", pharmacyId),
          where("isDeleted", "==", false),
        )
      : query(
          collection(db, SUPPLIERS_COLLECTION),
          where("isDeleted", "==", false),
        );
    const snapshot = await getDocs(supplierQuery);
    return snapshot.docs.map((docRef) => ({
      id: docRef.id,
      ...docRef.data(),
    }));
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
    const supplierRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    await updateDoc(supplierRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });
    return supplierId;
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw new Error(`Failed to delete supplier: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// SALES (Pharmacy-scoped)
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new sales transaction in Firestore
 */
export const createSale = async (sale, pharmacyId) => {
  try {
    const saleRef = await addDoc(collection(db, SALES_COLLECTION), {
      ...sale,
      quantity: Number(sale.quantity),
      amount: Number(sale.amount),
      pharmacyId,
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
 * Get all sales from Firestore (scoped to pharmacy)
 */
export const getAllSales = async (pharmacyId) => {
  try {
    const salesQuery = pharmacyId
      ? query(
          collection(db, SALES_COLLECTION),
          where("pharmacyId", "==", pharmacyId),
        )
      : query(collection(db, SALES_COLLECTION));
    const snapshot = await getDocs(salesQuery);
    const data = snapshot.docs.map((docRef) => ({
      id: docRef.id,
      ...docRef.data(),
    }));

    // Sort descending locally to avoid requiring composite indexes in Firestore
    return data.sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error loading sales:", error);
    throw new Error(`Failed to load sales: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT (Pharmacy-scoped)
// ═══════════════════════════════════════════════════════════════

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
      role: userData.role || "staff", // 'superadmin', 'admin', 'pharmacist', 'manager', 'staff'
      pharmacyId: userData.pharmacyId || null,
      pharmacyName: userData.pharmacyName || "",
      createdBy: userData.createdBy || null,
      avatar: userData.avatar || `https://i.pravatar.cc/150?u=${uid}`,
      status: userData.status || "pending",
      isDeleted: false,
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
 * Get all users (scoped to pharmacy, or all for superadmin)
 */
export const getAllUsers = async (pharmacyId) => {
  try {
    const q = pharmacyId
      ? query(
          collection(db, USERS_COLLECTION),
          where("pharmacyId", "==", pharmacyId),
          where("isDeleted", "==", false),
        )
      : query(
          collection(db, USERS_COLLECTION),
          where("isDeleted", "==", false),
        );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all users:", error);
    throw new Error(`Failed to retrieve users: ${error.message}`);
  }
};

/**
 * Soft-delete a user (sets isDeleted flag instead of destroying the document)
 */
export const softDeleteUser = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      status: "Deleted",
    });
    return userId;
  } catch (error) {
    console.error("Error soft-deleting user:", error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

/**
 * Update the status of every user that belongs to a given pharmacy.
 * Used by SuperAdmin when a pharmacy is activated or suspended, so all
 * staff accounts move in lockstep with their pharmacy.
 */
export const updateUserStatusByPharmacyId = async (pharmacyId, newStatus) => {
  try {
    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      where("pharmacyId", "==", pharmacyId),
    );
    const snapshot = await getDocs(usersQuery);

    if (snapshot.empty) {
      return 0;
    }

    const updates = snapshot.docs.map((userDoc) =>
      updateDoc(doc(db, USERS_COLLECTION, userDoc.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      }),
    );
    await Promise.all(updates);
    return snapshot.size;
  } catch (error) {
    console.error(
      `Error updating user status for pharmacy ${pharmacyId}:`,
      error,
    );
    throw new Error(`Failed to update user status: ${error.message}`);
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

export const generatePasswordFromEmail = (email) => {
  const username = email.split("@")[0];
  const digits = Math.floor(10000 + Math.random() * 90000); // 5 random digits
  return `${username}@${digits}`;
};

export const createStaffAccount = async (
  userData,
  pharmacyId,
  pharmacyName,
  createdBy,
) => {
  // A secondary Firebase app instance so the admin session on the
  // primary app is never touched. Reused if it already exists.
  const secondaryApp =
    getApps().find((a) => a.name === "StaffCreator") ||
    initializeApp(firebaseConfig, "StaffCreator");

  const secondaryAuth = getAuth(secondaryApp);
  const password = generatePasswordFromEmail(userData.email);

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      userData.email,
      password,
    );
    const { uid } = credential.user;

    // Sign out of the secondary app only — primary admin session untouched
    await firebaseSignOut(secondaryAuth);

    // Create the Firestore profile using the existing helper
    await createUserProfile(uid, {
      ...userData,
      pharmacyId,
      pharmacyName,
      createdBy,
      avatar: `https://i.pravatar.cc/150?u=${uid}`,
    });

    return { uid, password };
  } catch (error) {
    // Always clean up the secondary session on failure
    await firebaseSignOut(secondaryAuth).catch(() => {});
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// STOCK BATCHES (Pharmacy-scoped)
// ═══════════════════════════════════════════════════════════════

/**
 * Log a stock movement event (audit trail)
 * movementType: 'expired_disposal' | 'sale' | 'purchase' | 'adjustment' | 'return'
 */
export const createStockMovement = async (movement, pharmacyId) => {
  try {
    await addDoc(collection(db, "stockMovements"), {
      ...movement,
      pharmacyId: pharmacyId || null,
      timestamp: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error logging stock movement:", error);
    // Don't throw - movement logging is best-effort for now
    return false;
  }
};

/**
 * Get all stock batches from Firestore (scoped to pharmacy)
 */
export const getAllStockBatches = async (pharmacyId) => {
  try {
    const q = pharmacyId
      ? query(
          collection(db, STOCK_BATCHES_COLLECTION),
          where("pharmacyId", "==", pharmacyId),
          where("isDeleted", "==", false),
        )
      : query(
          collection(db, STOCK_BATCHES_COLLECTION),
          where("isDeleted", "==", false),
        );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading stock batches:", error);
    throw new Error(`Failed to load stock batches: ${error.message}`);
  }
};

/**
 * Create a new stock batch document in Firestore
 */
export const createStockBatch = async (batchData, pharmacyId) => {
  try {
    // We cannot use addDoc with a transaction directly before knowing the ID,
    // so we generate a doc ref first.
    const batchRef = doc(collection(db, STOCK_BATCHES_COLLECTION));
    const medicineRef = doc(db, MEDICINES_COLLECTION, batchData.medicineId);

    await runTransaction(db, async (transaction) => {
      const payload = {
        ...batchData,
        quantity: Number(batchData.quantity),
        costPrice: Number(batchData.costPrice),
        sellingPrice: Number(batchData.sellingPrice),
        status: batchData.quantity > 0 ? "In Stock" : "Out of Stock",
        pharmacyId,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(batchRef, payload);
      transaction.update(medicineRef, {
        totalStock: increment(Number(batchData.quantity)),
        updatedAt: serverTimestamp(),
      });
    });

    return { id: batchRef.id, ...batchData };
  } catch (error) {
    console.error("Error creating stock batch:", error);
    throw new Error(`Failed to create stock batch: ${error.message}`);
  }
};
/**
 * Update a specific stock batch (e.g., mark as disposed, reduce quantity)
 */
export const updateStockBatch = async (batchId, updates) => {
  try {
    const batchRef = doc(db, STOCK_BATCHES_COLLECTION, batchId);

    await runTransaction(db, async (transaction) => {
      const batchSnap = await transaction.get(batchRef);
      if (!batchSnap.exists()) throw new Error("Batch not found");

      const oldData = batchSnap.data();
      const newQuantity =
        updates.quantity !== undefined
          ? Number(updates.quantity)
          : oldData.quantity;
      const quantityDiff = newQuantity - Number(oldData.quantity);

      const updatePayload = { ...updates, updatedAt: serverTimestamp() };
      if (updates.quantity !== undefined) {
        updatePayload.status = newQuantity > 0 ? "In Stock" : "Out of Stock";
      }

      transaction.update(batchRef, updatePayload);

      // Only update medicine stock if quantity actually changed
      if (quantityDiff !== 0) {
        const medicineRef = doc(db, MEDICINES_COLLECTION, oldData.medicineId);
        transaction.update(medicineRef, {
          totalStock: increment(quantityDiff),
          updatedAt: serverTimestamp(),
        });
      }
    });

    return { id: batchId, ...updates };
  } catch (error) {
    console.error("Error updating stock batch:", error);
    throw new Error(`Failed to update stock batch: ${error.message}`);
  }
};
/**
 * Delete a specific stock batch
 */
export const deleteStockBatch = async (batchId) => {
  try {
    const batchRef = doc(db, STOCK_BATCHES_COLLECTION, batchId);
    await runTransaction(db, async (transaction) => {
      const batchSnap = await transaction.get(batchRef);
      if (!batchSnap.exists()) throw new Error("Batch not found");

      const data = batchSnap.data();
      if (data.isDeleted) return;

      transaction.update(batchRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });

      const medicineRef = doc(db, MEDICINES_COLLECTION, data.medicineId);
      transaction.update(medicineRef, {
        totalStock: increment(-Number(data.quantity || 0)),
        updatedAt: serverTimestamp(),
      });
    });
    return batchId;
  } catch (error) {
    console.error("Error deleting stock batch:", error);
    throw new Error(`Failed to delete stock batch: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// CHECKOUT TRANSACTION (Pharmacy-scoped)
// ═══════════════════════════════════════════════════════════════

/**
 * Process a secure, transaction-safe checkout.
 * Prevents overselling and generates sequential invoice numbers.
 * Invoice counter is now pharmacy-scoped.
 */
export const processCheckoutTransaction = async (
  cart,
  paymentMethod,
  userId,
  pharmacyId,
) => {
  const saleDocRef = doc(collection(db, SALES_COLLECTION));
  // Pharmacy-scoped invoice counter
  const counterDocRef = doc(db, "counters", `${pharmacyId}_invoiceNumber`);

  const result = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterDocRef);

    // Read all Batch References
    const batchRefs = cart.map((item) => doc(db, "stockBatches", item.batchId));
    const batchSnaps = await Promise.all(
      batchRefs.map((ref) => transaction.get(ref)),
    );

    const medicineRefs = cart.map((item) =>
      doc(db, MEDICINES_COLLECTION, item.medicineId),
    );

    // =========================================================
    // STEP 2: VALIDATION
    // =========================================================

    let nextInvoice = 1001; // Default starting number
    if (counterSnap.exists()) {
      nextInvoice = (counterSnap.data().sequence || 1000) + 1;
    }

    // Check if all batches have enough stock
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const batchSnap = batchSnaps[i];

      if (!batchSnap.exists()) {
        throw new Error(`Batch ${item.batchNo} no longer exists.`);
      }

      const currentQty = batchSnap.data().quantity || 0;
      if (currentQty < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.name} (Batch ${item.batchNo}). Only ${currentQty} left.`,
        );
      }
    }

    // =========================================================
    // STEP 3: ALL WRITES HAPPEN AFTER ALL READS & VALIDATIONS
    // =========================================================

    // Write Invoice Counter
    transaction.set(counterDocRef, {
      sequence: nextInvoice,
      pharmacyId,
      updatedAt: serverTimestamp(),
    });

    // Write Batch Updates (Deduct Stock)
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const batchRef = batchRefs[i];
      const medicineRef = medicineRefs[i];
      const currentQty = batchSnaps[i].data().quantity || 0;

      transaction.update(batchRef, {
        quantity: currentQty - item.quantity,
        status: currentQty - item.quantity === 0 ? "Out of Stock" : "In Stock",
        updatedAt: serverTimestamp(),
      });

      // Update Medicine Total Stock
      transaction.update(medicineRef, {
        totalStock: increment(-item.quantity),
        updatedAt: serverTimestamp(),
      });
    }

    // Write the Sale Record
    const now = new Date();
    const totalSale = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const salePayload = {
      invoiceNumber: `INV-${nextInvoice}`,
      date: now.toLocaleDateString(),
      createdAt: serverTimestamp(),
      status: "Completed",
      paymentMethod: paymentMethod,
      pharmacyId,
      total: totalSale,
      items: cart.map((i) => ({
        batchId: i.batchId,
        medicineId: i.medicineId,
        name: i.name,
        batchNo: i.batchNo,
        quantity: i.quantity,
        price: i.price,
        costPrice: i.costPrice || 0,
        total: i.price * i.quantity,
      })),
      performedBy: userId || "Unknown",
    };

    transaction.set(saleDocRef, salePayload);

    // Update pharmacyStats
    const pharmacyStatsRef = doc(db, "pharmacyStats", pharmacyId);
    transaction.set(
      pharmacyStatsRef,
      {
        totalRevenue: increment(totalSale),
        totalSalesCount: increment(1),
        updatedAt: serverTimestamp(),
        pharmacyId,
      },
      { merge: true },
    );

    // Update dailySalesStats
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const dailySalesStatsRef = doc(
      db,
      "dailySalesStats",
      `${pharmacyId}_${dateStr}`,
    );
    transaction.set(
      dailySalesStatsRef,
      {
        revenue: increment(totalSale),
        salesCount: increment(1),
        date: dateStr,
        pharmacyId,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return {
      saleId: saleDocRef.id,
      invoiceNumber: `INV-${nextInvoice}`,
      salePayload,
    };
  });

  return result;
};

// ═══════════════════════════════════════════════════════════════
// SETTINGS (Pharmacy-scoped)
// ═══════════════════════════════════════════════════════════════

/**
 * Get system settings scoped to a pharmacy (creates default if missing)
 */
export const getSystemSettings = async (pharmacyId) => {
  try {
    const settingsId = pharmacyId || "global";
    const docRef = doc(db, "settings", settingsId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    // Create defaults if they don't exist
    const defaults = {
      lowStockThreshold: 10,
      expiryWarningDays: 60,
      currency: "ETB",
      language: "en",
      pharmacyId,
    };
    await setDoc(docRef, defaults);
    return defaults;
  } catch (error) {
    console.error("Error loading settings:", error);
    return { lowStockThreshold: 10, expiryWarningDays: 60 }; // Fallback
  }
};

/**
 * Update system settings scoped to a pharmacy
 */
export const updateSystemSettings = async (updates, pharmacyId) => {
  try {
    const settingsId = pharmacyId || "global";
    const docRef = doc(db, "settings", settingsId);
    await setDoc(
      docRef,
      { ...updates, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return true;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw new Error("Failed to save settings");
  }
};

// ═══════════════════════════════════════════════════════════════
// REFUND TRANSACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Process a secure refund transaction.
 * Restores stock to the exact batches and marks the sale as Refunded.
 */
export const processRefundTransaction = async (saleId, saleItems, userId) => {
  const saleDocRef = doc(db, SALES_COLLECTION, saleId);

  await runTransaction(db, async (transaction) => {
    // 1. READ PHASE
    const saleSnap = await transaction.get(saleDocRef);
    if (!saleSnap.exists()) throw new Error("Sale record not found.");
    if (saleSnap.data().status === "Refunded")
      throw new Error("This sale has already been refunded.");

    const batchRefs = saleItems.map((item) =>
      doc(db, "stockBatches", item.batchId),
    );
    const batchSnaps = await Promise.all(
      batchRefs.map((ref) => transaction.get(ref)),
    );

    const medicineRefs = saleItems.map((item) =>
      doc(db, MEDICINES_COLLECTION, item.medicineId),
    );

    // 2. WRITE PHASE
    for (let i = 0; i < saleItems.length; i++) {
      const item = saleItems[i];
      if (!batchSnaps[i].exists()) {
        throw new Error(
          `Batch ${item.batchNo} was deleted from the system. Cannot restore stock.`,
        );
      }

      const currentQty = batchSnaps[i].data().quantity || 0;
      transaction.update(batchRefs[i], {
        quantity: currentQty + item.quantity,
        status: "In Stock", // Restoring stock makes it active again
        updatedAt: serverTimestamp(),
      });

      // Update Medicine Total Stock
      transaction.update(medicineRefs[i], {
        totalStock: increment(item.quantity),
        updatedAt: serverTimestamp(),
      });
    }

    // Update Sale Status
    transaction.update(saleDocRef, {
      status: "Refunded",
      refundedAt: serverTimestamp(),
      refundedBy: userId || "Unknown",
    });

    const pharmacyId = saleSnap.data().pharmacyId;
    const totalSale = saleSnap.data().total || 0;
    let dateStr;
    const saleDate = saleSnap.data().createdAt?.toDate
      ? saleSnap.data().createdAt.toDate()
      : new Date();
    if (!isNaN(saleDate)) {
      dateStr = saleDate.toISOString().slice(0, 10);
    } else {
      dateStr = new Date().toISOString().slice(0, 10);
    }

    // Decrement stats
    if (pharmacyId) {
      const pharmacyStatsRef = doc(db, "pharmacyStats", pharmacyId);
      transaction.set(
        pharmacyStatsRef,
        {
          totalRevenue: increment(-totalSale),
          totalSalesCount: increment(-1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const dailySalesStatsRef = doc(
        db,
        "dailySalesStats",
        `${pharmacyId}_${dateStr}`,
      );
      transaction.set(
        dailySalesStatsRef,
        {
          revenue: increment(-totalSale),
          salesCount: increment(-1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  });

  return true;
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD STATS & REAL-TIME
// ═══════════════════════════════════════════════════════════════

export const subscribeToPharmacyStats = (pharmacyId, callback) => {
  const q = doc(db, "pharmacyStats", pharmacyId);
  return onSnapshot(q, (doc) => {
    callback(
      doc.exists() ? doc.data() : { totalRevenue: 0, totalSalesCount: 0 },
    );
  });
};

export const subscribeToDailySalesStats = (pharmacyId, callback) => {
  const q = query(
    collection(db, "dailySalesStats"),
    where("pharmacyId", "==", pharmacyId),
    orderBy("date", "asc"),
  );
  return onSnapshot(q, (snapshot) => {
    const stats = snapshot.docs.map((doc) => doc.data());
    callback(stats);
  });
};

export const getDashboardStockStats = async (pharmacyId, settings) => {
  const batchesRef = collection(db, STOCK_BATCHES_COLLECTION);
  const qBase = query(
    batchesRef,
    where("pharmacyId", "==", pharmacyId),
    where("isDeleted", "==", false),
  );

  // 1. Total Inventory Stock (using getAggregateFromServer)
  const totalStockAgg = await getAggregateFromServer(qBase, {
    total: sum("quantity"),
  });

  // Total batches
  const totalBatchesSnap = await getCountFromServer(qBase);

  // 2. Out of stock
  const outOfStockSnap = await getCountFromServer(
    query(qBase, where("quantity", "==", 0)),
  );

  // 3. Low stock
  const lowStockSnap = await getCountFromServer(
    query(
      qBase,
      where("quantity", ">", 0),
      where("quantity", "<=", Number(settings?.lowStockThreshold || 10)),
    ),
  );

  // 4. Expired
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiredSnap = await getCountFromServer(
    query(qBase, where("expiry", "<", now)),
  );

  return {
    inventoryStock: totalStockAgg.data().total || 0,
    totalBatches: totalBatchesSnap.data().count || 0,
    outOfStock: outOfStockSnap.data().count || 0,
    lowStock: lowStockSnap.data().count || 0,
    expired: expiredSnap.data().count || 0,
  };
};

export const subscribeToRecentSales = (pharmacyId, limitCount, callback) => {
  const q = query(
    collection(db, SALES_COLLECTION),
    where("pharmacyId", "==", pharmacyId),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(sales);
  });
};

export const getRecentSales = async (pharmacyId, limitCount = 50) => {
  const q = query(
    collection(db, SALES_COLLECTION),
    where("pharmacyId", "==", pharmacyId),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getSalesByDateRange = async (pharmacyId, start, end) => {
  const q = query(
    collection(db, SALES_COLLECTION),
    where("pharmacyId", "==", pharmacyId),
    where("createdAt", ">=", start),
    where("createdAt", "<=", end),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
