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
      avatar: userData.avatar || null,
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
  // Get the API URL from environment variables (works for both localhost and Vercel)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  try {
    const response = await fetch(`${API_URL}/staff/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        pharmacyId,
        pharmacyName,
        createdBy
      })
    });

    const result = await response.json();

    if (!response.ok) {
      const error = new Error(result.error || 'Failed to create staff');
      // Pass the specific error code so the frontend can show "Email already in use"
      if (result.error === 'auth/email-already-in-use') {
        error.code = 'auth/email-already-in-use';
      }
      throw error;
    }

    // Return the exact same format the frontend expects
    return { uid: result.uid, password: result.password };
    
  } catch (error) {
    console.error('Frontend service error creating staff:', error);
    throw error;
  }
};

// Disable staff (soft delete)
export const disableStaff = async (userId) => {
  const API_URL ='http://localhost:5000/api';
  
  try {
    const response = await fetch(`${API_URL}/staff/disable/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to disable staff');
    }

    return userId;
  } catch (error) {
    console.error('Error disabling staff:', error);
    throw error;
  }
};

// Hard delete staff (permanent)
export const hardDeleteStaff = async (userId) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  try {
    const response = await fetch(`${API_URL}/staff/hard-delete/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete staff');
    }

    return userId;
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
};

// Re-enable staff
export const enableStaff = async (userId) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  try {
    const response = await fetch(`${API_URL}/staff/enable/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to enable staff');
    }

    return userId;
  } catch (error) {
    console.error('Error enabling staff:', error);
    throw error;
  }
};
