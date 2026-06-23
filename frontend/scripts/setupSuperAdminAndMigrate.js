import admin from "firebase-admin";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The user must provide a serviceAccountKey.json in the scripts folder
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Error: serviceAccountKey.json not found in the scripts directory.");
  console.log("Please download it from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key.");
  console.log("Save it as: scripts/serviceAccountKey.json");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function runSetup() {
  console.log("=== 🚀 Multi-Tenant Setup & Migration Script ===");

  const answers = await inquirer.prompt([
    { type: "input", name: "superAdminEmail", message: "Enter Super Admin Email:" },
    { type: "password", name: "superAdminPassword", message: "Enter Super Admin Password:" },
    { type: "input", name: "superAdminName", message: "Enter Super Admin Name:", default: "Super Admin" },
    { type: "input", name: "defaultPharmacyName", message: "Enter Name for the Default Pharmacy (for existing data):", default: "Main Pharmacy" }
  ]);

  try {
    // 1. Create Super Admin
    console.log("\n1️⃣  Creating Super Admin Account...");
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(answers.superAdminEmail);
      console.log("User already exists in Auth, updating password...");
      await auth.updateUser(userRecord.uid, { password: answers.superAdminPassword });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: answers.superAdminEmail,
          password: answers.superAdminPassword,
          displayName: answers.superAdminName,
        });
        console.log("Created new Super Admin in Firebase Auth.");
      } else {
        throw error;
      }
    }

    await db.collection("users").doc(userRecord.uid).set({
      email: answers.superAdminEmail,
      name: answers.superAdminName,
      role: "superadmin",
      status: "Active",
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log("✅ Super Admin Profile created in Firestore.");

    // 2. Create Default Pharmacy
    console.log(`\n2️⃣  Creating Default Pharmacy: "${answers.defaultPharmacyName}"...`);
    const pharmacyRef = await db.collection("pharmacies").add({
      name: answers.defaultPharmacyName,
      status: "active",
      createdAt: new Date().toISOString()
    });
    const defaultPharmacyId = pharmacyRef.id;
    console.log(`✅ Default Pharmacy created with ID: ${defaultPharmacyId}`);

    // 3. Migrate Existing Data
    console.log("\n3️⃣  Migrating existing data to Default Pharmacy...");
    const collectionsToMigrate = ["medicines", "stockBatches", "sales", "suppliers", "stockMovements", "users"];

    for (const colName of collectionsToMigrate) {
      console.log(`Migrating ${colName}...`);
      const snapshot = await db.collection(colName).get();
      let count = 0;
      const batch = db.batch();

      snapshot.forEach(doc => {
        const data = doc.data();
        // Skip Super Admin user
        if (colName === "users" && data.role === "superadmin") return;
        
        if (!data.pharmacyId) {
          batch.update(doc.ref, { pharmacyId: defaultPharmacyId });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`  -> Updated ${count} documents in ${colName}.`);
      } else {
        console.log(`  -> No documents needed migration in ${colName}.`);
      }
    }

    console.log("\n🎉 Setup & Migration Complete!");
    console.log(`Super Admin Email: ${answers.superAdminEmail}`);
    console.log("You can now start the application and log in.");

  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
}

runSetup();
