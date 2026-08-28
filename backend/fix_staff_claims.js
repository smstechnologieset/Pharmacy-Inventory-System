import { initializeFirebase, getFirestore } from "./src/config/firebase.js";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();
initializeFirebase();
const db = getFirestore();

async function fixStaffClaims() {
  console.log("Checking for staff users without custom claims...");
  
  // Get all users from the 'users' collection that have a pharmacyId and role=staff/pharmacist/admin
  const usersSnapshot = await db.collection("users")
    .where("role", "in", ["staff", "pharmacist", "admin", "pharmacy_admin"])
    .get();
  
  let fixed = 0;
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const uid = doc.id;
    
    if (!userData.pharmacyId) {
      console.log(`  Skipping ${userData.email} - no pharmacyId`);
      continue;
    }
    
    try {
      // Check current claims
      const userRecord = await admin.auth().getUser(uid);
      const currentClaims = userRecord.customClaims || {};
      
      if (!currentClaims.pharmacyId || !currentClaims.role) {
        console.log(`  Fixing claims for: ${userData.email} (role: ${userData.role}, pharmacyId: ${userData.pharmacyId})`);
        await admin.auth().setCustomUserClaims(uid, {
          role: userData.role,
          pharmacyId: userData.pharmacyId,
        });
        fixed++;
        console.log(`  ✅ Fixed!`);
      } else {
        console.log(`  ✓ ${userData.email} already has claims`);
      }
    } catch (err) {
      console.error(`  ❌ Error fixing ${userData.email}:`, err.message);
    }
  }
  
  console.log(`\nDone. Fixed ${fixed} staff accounts.`);
  process.exit(0);
}

fixStaffClaims().catch(console.error);
