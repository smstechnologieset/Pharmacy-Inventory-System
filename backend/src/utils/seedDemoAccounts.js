import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = join(__dirname, "../../serviceAccountKey.json");
if (!existsSync(serviceAccountPath)) {
  console.error("❌ serviceAccountKey.json not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function createOrUpdateUser(email, password, displayName, role, pharmacyId = null, pharmacyName = "") {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`ℹ️  User ${email} already exists in Firebase Auth. Updating password & verification...`);
    await auth.updateUser(userRecord.uid, {
      password: password,
      displayName: displayName,
      emailVerified: true,
    });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      });
      console.log(`✅ Created user ${email} in Firebase Auth.`);
    } else {
      throw error;
    }
  }

  // Set Custom User Claims for Backend Authentication
  const claims = { role };
  if (pharmacyId) claims.pharmacyId = pharmacyId;
  await auth.setCustomUserClaims(userRecord.uid, claims);

  // User Profile Document
  const profileData = {
    uid: userRecord.uid,
    email,
    name: displayName,
    role,
    status: "active",
    pharmacyId,
    pharmacyName,
    isDeleted: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("users").doc(userRecord.uid).set(profileData, { merge: true });

  if (pharmacyId) {
    await db.collection("pharmacies").doc(pharmacyId).collection("members").doc(userRecord.uid).set(profileData, { merge: true });
  }

  return userRecord;
}

async function seedDemoData() {
  console.log("\n🌱 --- STARTING PHARMACARE DEMO DATA SEEDING ---\n");

  const pharmacyId = "pharmacy_citycare";
  const pharmacyName = "City Care Pharmacy";

  // 1. Create Pharmacy Top-Level Document
  console.log("1️⃣  Setting up Pharmacy Profile...");
  const pharmacyRef = db.collection("pharmacies").doc(pharmacyId);
  await pharmacyRef.set({
    name: pharmacyName,
    email: "contact@citypharmacy.com",
    phone: "+251911223344",
    address: "Bole Road, Addis Ababa, Ethiopia",
    status: "active",
    subscription: {
      status: "active",
      plan: "pro",
      startDate: new Date().toISOString(),
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`✅ Pharmacy "${pharmacyName}" (${pharmacyId}) is active.`);

  // 2. Create Accounts
  console.log("\n2️⃣  Seeding Accounts...");
  
  // Super Admin
  await createOrUpdateUser("superadmin@pharmacare.com", "Password123!", "System Super Admin", "superadmin");
  console.log("   ➡️ Super Admin created: superadmin@pharmacare.com / Password123!");

  // Pharmacy Admin
  await createOrUpdateUser("admin@citypharmacy.com", "Password123!", "Abebe Bikila (Admin)", "admin", pharmacyId, pharmacyName);
  console.log("   ➡️ Pharmacy Admin created: admin@citypharmacy.com / Password123!");

  // Pharmacist
  await createOrUpdateUser("pharmacist@citypharmacy.com", "Password123!", "Tigist Haile (Pharmacist)", "pharmacist", pharmacyId, pharmacyName);
  console.log("   ➡️ Pharmacist created: pharmacist@citypharmacy.com / Password123!");

  // Manager
  await createOrUpdateUser("manager@citypharmacy.com", "Password123!", "Kebede Tadesse (Manager)", "manager", pharmacyId, pharmacyName);
  console.log("   ➡️ Manager created: manager@citypharmacy.com / Password123!");

  // 3. Seed Suppliers
  console.log("\n3️⃣  Seeding Suppliers...");
  const suppliersRef = pharmacyRef.collection("suppliers");
  const suppliers = [
    { id: "sup_1", name: "EPHARM (Ethiopian Pharmaceuticals)", contact: "Solomon D.", phone: "+251911111111", email: "sales@epharm.et", address: "Akaki Kality, Addis Ababa" },
    { id: "sup_2", name: "Cadila Pharmaceuticals Ethiopia", contact: "Meron G.", phone: "+251922222222", email: "info@cadila.et", address: "Gurd Shola, Addis Ababa" },
    { id: "sup_3", name: "MedTech Ethiopia", contact: "Dawit K.", phone: "+251933333333", email: "orders@medtech.et", address: "Gotera, Addis Ababa" },
  ];

  for (const sup of suppliers) {
    await suppliersRef.doc(sup.id).set({
      ...sup,
      pharmacyId,
      isDeleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  console.log(`✅ ${suppliers.length} Suppliers seeded.`);

  // 4. Seed Medicines Master Catalog
  console.log("\n4️⃣  Seeding Medicines Master Catalog...");
  const medicinesRef = pharmacyRef.collection("medicines");
  const medicines = [
    { id: "med_1", name: "Paracetamol 500mg Tablet", category: "Analgesic", price: 15, totalStock: 620, supplierId: "sup_1", supplierName: "EPHARM (Ethiopian Pharmaceuticals)", description: "Pain reliever and fever reducer" },
    { id: "med_2", name: "Amoxicillin 500mg Capsule", category: "Antibiotics", price: 25, totalStock: 345, supplierId: "sup_2", supplierName: "Cadila Pharmaceuticals Ethiopia", description: "Broad-spectrum penicillin antibiotic" },
    { id: "med_3", name: "Metformin 850mg Tablet", category: "Diabetes", price: 30, totalStock: 8, supplierId: "sup_2", supplierName: "Cadila Pharmaceuticals Ethiopia", description: "First-line medication for type 2 diabetes" },
    { id: "med_4", name: "Omeprazole 20mg Capsule", category: "Gastrointestinal", price: 20, totalStock: 200, supplierId: "sup_1", supplierName: "EPHARM (Ethiopian Pharmaceuticals)", description: "Proton pump inhibitor for acid reflux" },
    { id: "med_5", name: "Atorvastatin 20mg Tablet", category: "Cardiovascular", price: 45, totalStock: 150, supplierId: "sup_3", supplierName: "MedTech Ethiopia", description: "Statin medication for lowering cholesterol" },
    { id: "med_6", name: "Disposable Gloves (Box of 100)", category: "Medical Supplies", price: 450, totalStock: 1200, supplierId: "sup_3", supplierName: "MedTech Ethiopia", description: "Latex examination gloves" },
  ];

  for (const med of medicines) {
    await medicinesRef.doc(med.id).set({
      ...med,
      pharmacyId,
      isDeleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  console.log(`✅ ${medicines.length} Medicines seeded.`);

  // 5. Seed Stock Batches
  console.log("\n5️⃣  Seeding Stock Batches...");
  const batchesRef = pharmacyRef.collection("stockBatches");
  
  const today = new Date();
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().slice(0, 10);
  const pastDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);

  const batches = [
    { id: "batch_1", medicineId: "med_1", medicineName: "Paracetamol 500mg Tablet", batchNo: "P204/1", expiry: nextYear, quantity: 500, costPrice: 10, sellingPrice: 15, status: "In Stock" },
    { id: "batch_2", medicineId: "med_1", medicineName: "Paracetamol 500mg Tablet", batchNo: "P203/1", expiry: nextMonth, quantity: 120, costPrice: 9, sellingPrice: 15, status: "In Stock" }, // Expiring soon
    { id: "batch_3", medicineId: "med_2", medicineName: "Amoxicillin 500mg Capsule", batchNo: "A104/1", expiry: nextYear, quantity: 300, costPrice: 18, sellingPrice: 25, status: "In Stock" },
    { id: "batch_4", medicineId: "med_2", medicineName: "Amoxicillin 500mg Capsule", batchNo: "A103/1", expiry: pastDate, quantity: 45, costPrice: 18, sellingPrice: 25, status: "In Stock" }, // Expired
    { id: "batch_5", medicineId: "med_3", medicineName: "Metformin 850mg Tablet", batchNo: "M304/1", expiry: nextYear, quantity: 8, costPrice: 22, sellingPrice: 30, status: "In Stock" }, // Low stock
    { id: "batch_6", medicineId: "med_4", medicineName: "Omeprazole 20mg Capsule", batchNo: "O104/1", expiry: nextYear, quantity: 200, costPrice: 12, sellingPrice: 20, status: "In Stock" },
    { id: "batch_7", medicineId: "med_5", medicineName: "Atorvastatin 20mg Tablet", batchNo: "A403/1", expiry: nextYear, quantity: 150, costPrice: 35, sellingPrice: 45, status: "In Stock" },
    { id: "batch_8", medicineId: "med_6", medicineName: "Disposable Gloves (Box of 100)", batchNo: "D103/1", expiry: nextYear, quantity: 1200, costPrice: 300, sellingPrice: 450, status: "In Stock" },
  ];

  for (const batch of batches) {
    await batchesRef.doc(batch.id).set({
      ...batch,
      pharmacyId,
      isDeleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  console.log(`✅ ${batches.length} Stock Batches seeded.`);

  // 6. Seed Sales
  console.log("\n6️⃣  Seeding Sales Records...");
  const salesRef = pharmacyRef.collection("sales");
  const sales = [
    {
      id: "sale_1001",
      invoiceNumber: "INV-1001",
      date: new Date().toLocaleDateString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "Completed",
      paymentMethod: "Cash",
      pharmacyId,
      total: 450,
      items: [
        { batchId: "batch_3", medicineId: "med_2", name: "Amoxicillin 500mg Capsule", batchNo: "A104/1", quantity: 18, price: 25, costPrice: 18, total: 450 }
      ],
      performedBy: "Abebe Bikila",
    },
    {
      id: "sale_1002",
      invoiceNumber: "INV-1002",
      date: new Date().toLocaleDateString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "Completed",
      paymentMethod: "Telebirr",
      pharmacyId,
      total: 150,
      items: [
        { batchId: "batch_1", medicineId: "med_1", name: "Paracetamol 500mg Tablet", batchNo: "P204/1", quantity: 10, price: 15, costPrice: 10, total: 150 }
      ],
      performedBy: "Tigist Haile",
    },
    {
      id: "sale_1003",
      invoiceNumber: "INV-1003",
      date: new Date().toLocaleDateString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "Completed",
      paymentMethod: "CBE Birr",
      pharmacyId,
      total: 900,
      items: [
        { batchId: "batch_7", medicineId: "med_5", name: "Atorvastatin 20mg Tablet", batchNo: "A403/1", quantity: 20, price: 45, costPrice: 35, total: 900 }
      ],
      performedBy: "Tigist Haile",
    }
  ];

  let grandTotalSales = 0;
  for (const sale of sales) {
    grandTotalSales += sale.total;
    await salesRef.doc(sale.id).set(sale, { merge: true });
  }
  console.log(`✅ ${sales.length} Sales transactions seeded.`);

  // 7. Seed Settings & Stats
  console.log("\n7️⃣  Seeding Pharmacy Settings & Stats...");
  await pharmacyRef.collection("settings").doc("settings").set({
    lowStockThreshold: 10,
    expiryWarningDays: 60,
    currency: "ETB",
    language: "en",
    pharmacyId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await pharmacyRef.collection("stats").doc("pharmacy").set({
    kind: "pharmacy",
    totalRevenue: grandTotalSales,
    totalSalesCount: sales.length,
    pharmacyId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Counter
  await pharmacyRef.collection("counters").doc("invoiceNumber").set({
    sequence: 1003,
    pharmacyId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log("✅ Settings & Stats initialized.");

  console.log("\n==================================================");
  console.log("🎉 SEEDING COMPLETE! You can log in with:");
  console.log("==================================================");
  console.log("📱 FRONTEND (http://localhost:5173):");
  console.log("   👑 Pharmacy Admin: admin@citypharmacy.com / Password123!");
  console.log("   💊 Pharmacist:     pharmacist@citypharmacy.com / Password123!");
  console.log("   📊 Manager:        manager@citypharmacy.com / Password123!");
  console.log("\n🦸 SUPER ADMIN (http://localhost:5174 or /super-admin):");
  console.log("   ⚡ Super Admin:    superadmin@pharmacare.com / Password123!");
  console.log("==================================================\n");
}

seedDemoData().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
