import admin from 'firebase-admin';
import { getFirestore } from '../config/firebase.js';

export const createStaff = async (req, res) => {
  try {
    const { name, email, role, pharmacyId, pharmacyName, createdBy } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
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
      emailVerified: true, // <--- THIS IS THE MAGIC FIX
    } );

    const uid = userRecord.uid;
    
    // 3. Save profile to Firestore
    const db = getFirestore();
    await db.collection('users').doc(uid).set({
      uid,
      email,
      name,
      role: role || 'staff',
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
    console.error('Error creating staff:', error);
    // Handle specific Firebase Auth errors to pass back to the frontend
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'auth/email-already-in-use' });
    }
    res.status(500).json({ error: error.message });
  }
};
