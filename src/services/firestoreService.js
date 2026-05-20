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



const USERS_COLLECTION = "users";

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
