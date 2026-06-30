import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { USERS_COLLECTION } from "./collections";
import { memberDoc, tenantCollection } from "./firestorePaths.js";
import { getAuthHeaders } from "./apiHelper.js";

export const createUserProfile = async (uid, userData) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const profileData = {
      uid,
      email: userData.email,
      name: userData.name || "",
      role: userData.role || "staff",
      pharmacyId: userData.pharmacyId || null,
      pharmacyName: userData.pharmacyName || "",
      createdBy: userData.createdBy || null,
      avatar: userData.avatar || null,
      status: userData.status || "pending",
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userDocRef, profileData);
    if (profileData.pharmacyId) {
      await setDoc(memberDoc(profileData.pharmacyId, uid), profileData);
    }
    return profileData;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
};

export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) return userDoc.data();
    else throw new Error("User profile not found");
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw new Error(`Failed to retrieve user profile: ${error.message}`);
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const existing = await getDoc(userDocRef);
    const updateData = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(userDocRef, updateData);
    const pharmacyId = updates.pharmacyId || existing.data()?.pharmacyId;
    if (pharmacyId) {
      await updateDoc(memberDoc(pharmacyId, uid), updateData);
    }
    return updateData;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

export const getUserByEmail = async (email) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", email),
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) return querySnapshot.docs[0].data();
    return null;
  } catch (error) {
    console.error("Error querying user by email:", error);
    throw new Error(`Failed to query user: ${error.message}`);
  }
};

export const getAllUsers = async (pharmacyId) => {
  try {
    const q = pharmacyId
      ? query(
          tenantCollection(pharmacyId, "members"),
          where("isDeleted", "==", false),
        )
      : query(
          collection(db, USERS_COLLECTION),
          where("isDeleted", "==", false),
        );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting all users:", error);
    throw new Error(`Failed to retrieve users: ${error.message}`);
  }
};

export const softDeleteUser = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    const updates = {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      status: "Deleted",
    };
    await updateDoc(userRef, updates);
    const pharmacyId = userSnap.data()?.pharmacyId;
    if (pharmacyId) {
      await updateDoc(memberDoc(pharmacyId, userId), updates);
    }
    return userId;
  } catch (error) {
    console.error("Error soft-deleting user:", error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

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
