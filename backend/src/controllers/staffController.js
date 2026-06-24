import admin from "firebase-admin";
import { getFirestore } from "../config/firebase.js";

export const createStaff = async (req, res) => {
  try {
    const { name, email, role, pharmacyId, pharmacyName, createdBy } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // 1. Generate a secure random password
    const username = email.split("@")[0];
    const digits = Math.floor(10000 + Math.random() * 90000);
    const password = `${username}@${digits}`;

    // 2. Create user with Firebase Admin SDK (and verify email instantly!)
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true, 
    });

    const uid = userRecord.uid;


    // 3. Save profile to Firestore
    const db = getFirestore();
    await db
      .collection("users")
      .doc(uid)
      .set({
        uid,
        email,
        name,
        role: role || "staff",
        pharmacyId: pharmacyId || null,
        pharmacyName: pharmacyName || "",
        createdBy: createdBy || null,
        avatar: `https://i.pravatar.cc/150?u=${uid}`,
        status: "Active",
        isDeleted: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // 4. Return the credentials to the frontend
    res.status(201).json({ success: true, uid, password });
  } catch (error) {
    console.error("Error creating staff:", error);
    // Handle specific Firebase Auth errors to pass back to the frontend
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({ error: "auth/email-already-in-use" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Disable staff (soft delete) - Actually disables in Firebase Auth
export const disableStaff = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // 1. Disable the user in Firebase Auth (prevents login)
    try {
      await admin.auth().updateUser(userId, {
        disabled: true, 
      });
      console.log(`✅ Disabled user in Firebase Auth: ${userId}`);
    } catch (authError) {
      // If user doesn't exist in Auth, continue anyway
      if (authError.code !== "auth/user-not-found") {
        console.error("Firebase Auth disable error:", authError);
      }
    }

    // 2. Update status in Firestore (for UI display)
    const db = getFirestore();
    await db.collection("users").doc(userId).update({
      status: "Disabled",
      isDeleted: true,
      disabledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: "Staff member disabled successfully" });
  } catch (error) {
    console.error("Error disabling staff:", error);
    res.status(500).json({ error: error.message });
  }
};

// Re-enable staff
export const enableStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // 1. Re-enable the user in Firebase Auth
    try {
      await admin.auth().updateUser(userId, {
        disabled: false, // <--- THIS ALLOWS LOGIN AGAIN
      });
      console.log(`✅ Re-enabled user in Firebase Auth: ${userId}`);
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        console.error('Firebase Auth enable error:', authError);
      }
    }

    // 2. Update status in Firestore
    const db = getFirestore();
    await db.collection('users').doc(userId).update({
      status: 'Active',
      isDeleted: false,
      disabledAt: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: 'Staff member re-enabled successfully' });
  } catch (error) {
    console.error('Error enabling staff:', error);
    res.status(500).json({ error: error.message });
  }
};

// Hard delete staff (remove completely)
export const hardDeleteStaff = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // 1. Delete from Firebase Auth
    try {
      await admin.auth().deleteUser(userId);
      console.log(`✅ Deleted user from Firebase Auth: ${userId}`);
    } catch (authError) {
      // If user doesn't exist in Auth, continue anyway
      if (authError.code !== "auth/user-not-found") {
        console.error("Firebase Auth delete error:", authError);
      }
    }

    // 2. Delete from Firestore
    const db = getFirestore();
    await db.collection("users").doc(userId).delete();

    res.json({ success: true, message: "Staff member permanently deleted" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: error.message });
  }
};
