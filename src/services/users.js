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
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";
import { db, firebaseConfig } from "./firebase";
import { USERS_COLLECTION } from "./collections";

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
    const updateData = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(userDocRef, updateData);
    return updateData;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

export const getUserByEmail = async (email) => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email));
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
      ? query(collection(db, USERS_COLLECTION), where("pharmacyId", "==", pharmacyId), where("isDeleted", "==", false))
      : query(collection(db, USERS_COLLECTION), where("isDeleted", "==", false));
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
    await updateDoc(userRef, { isDeleted: true, deletedAt: serverTimestamp(), status: "Deleted" });
    return userId;
  } catch (error) {
    console.error("Error soft-deleting user:", error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

export const getUsersByRole = async (role) => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error getting users by role:", error);
    throw new Error(`Failed to retrieve users by role: ${error.message}`);
  }
};

export const generatePasswordFromEmail = (email) => {
  const username = email.split("@")[0];
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `${username}@${digits}`;
};

export const createStaffAccount = async (userData, pharmacyId, pharmacyName, createdBy) => {
  const secondaryApp = getApps().find((a) => a.name === "StaffCreator") || initializeApp(firebaseConfig, "StaffCreator");
  const secondaryAuth = getAuth(secondaryApp);
  const password = generatePasswordFromEmail(userData.email);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, password);
    const { uid } = credential.user;
    await firebaseSignOut(secondaryAuth);

    await createUserProfile(uid, {
      ...userData,
      pharmacyId,
      pharmacyName,
      createdBy,
      avatar: `https://i.pravatar.cc/150?u=${uid}`,
    });

    return { uid, password };
  } catch (error) {
    await firebaseSignOut(secondaryAuth).catch(() => {});
    throw error;
  }
};
