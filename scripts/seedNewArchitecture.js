/* eslint-disable no-undef */
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  addDoc,
  collection,
  Timestamp,
  doc,
  setDoc,
} from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = path.resolve(__dirname, "../.env.local"); // Adjust path if needed

const parseEnv = (contents) =>
  contents
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split("=");
      acc[key.trim()] = rest.join("=").trim();
      return acc;
    }, {});

const loadEnv = async () => {
  try {
    const contents = await readFile(envFile, "utf8");
    return parseEnv(contents);
  } catch {
    throw new Error("Unable to read .env.local.");
  }
};

const ts = (dateStr) => Timestamp.fromDate(new Date(dateStr));

const main = async () => {
  const env = await loadEnv();
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("🌱 Seeding new relational architecture...\n");

  // 1. Seed Suppliers
  const suppliersData = [
    {
      name: "PharmaCorp",
      contact: "John Doe",
      phone: "+1234567890",
      email: "john@pharmacorp.com",
    },
    {
      name: "MediSupply",
      contact: "Jane Smith",
      phone: "+0987654321",
      email: "jane@medisupply.com",
    },
    {
      name: "HealthLine",
      contact: "Alemayehu T.",
      phone: "+2519112233",
      email: "alem@healthline.et",
    },
  ];

  const supplierRefs = [];
  for (const s of suppliersData) {
    const ref = await addDoc(collection(db, "suppliers"), {
      ...s,
      createdAt: ts("2023-01-01"),
    });
    supplierRefs.push({ id: ref.id, ...s });
  }
  console.log(`✓ Seeded ${supplierRefs.length} suppliers`);

  // 2. Seed Medicines (Master Catalog)
  const medicinesData = [
    {
      name: "Paracetamol 500mg",
      category: "Analgesics",
      price: 15,
      supplierId: supplierRefs[0].id,
      supplierName: supplierRefs[0].name,
    },
    {
      name: "Amoxicillin 500mg",
      category: "Antibiotics",
      price: 25,
      supplierId: supplierRefs[1].id,
      supplierName: supplierRefs[1].name,
    },
    {
      name: "Metformin 850mg",
      category: "Diabetes",
      price: 30,
      supplierId: supplierRefs[1].id,
      supplierName: supplierRefs[1].name,
    },
    {
      name: "Atorvastatin 20mg",
      category: "Cardiovascular",
      price: 45,
      supplierId: supplierRefs[2].id,
      supplierName: supplierRefs[2].name,
    },
    {
      name: "Omeprazole 20mg",
      category: "Gastro",
      price: 20,
      supplierId: supplierRefs[0].id,
      supplierName: supplierRefs[0].name,
    },
    {
      name: "DC Examination Gloves",
      category: "Supplies",
      price: 45,
      supplierId: supplierRefs[2].id,
      supplierName: supplierRefs[2].name,
    },
  ];

  const medRefs = [];
  for (const m of medicinesData) {
    const ref = await addDoc(collection(db, "medicines"), {
      ...m,
      createdAt: ts("2023-01-01"),
    });
    medRefs.push({ id: ref.id, ...m });
  }
  console.log(`✓ Seeded ${medRefs.length} medicines`);

  const getMedId = (name) => medRefs.find((m) => m.name === name).id;

  // 3. Seed Stock Batches (Inventory)
  const batchesData = [
    {
      medicineId: getMedId("Paracetamol 500mg"),
      batchNo: "P204/1",
      expiry: ts("2026-12-01"),
      quantity: 500,
      costPrice: 10,
      sellingPrice: 15,
      status: "In Stock",
    },
    {
      medicineId: getMedId("Paracetamol 500mg"),
      batchNo: "P203/1",
      expiry: ts("2026-06-15"),
      quantity: 120,
      costPrice: 9,
      sellingPrice: 15,
      status: "In Stock",
    }, // Expiring soon
    {
      medicineId: getMedId("Amoxicillin 500mg"),
      batchNo: "A104/1",
      expiry: ts("2027-05-20"),
      quantity: 300,
      costPrice: 18,
      sellingPrice: 25,
      status: "In Stock",
    },
    {
      medicineId: getMedId("Amoxicillin 500mg"),
      batchNo: "A103/1",
      expiry: ts("2024-01-10"),
      quantity: 45,
      costPrice: 18,
      sellingPrice: 25,
      status: "In Stock",
    }, // Expired!
    {
      medicineId: getMedId("Metformin 850mg"),
      batchNo: "M304/1",
      expiry: ts("2028-01-01"),
      quantity: 8,
      costPrice: 22,
      sellingPrice: 30,
      status: "In Stock",
    }, // Low stock!
    {
      medicineId: getMedId("Atorvastatin 20mg"),
      batchNo: "A403/1",
      expiry: ts("2027-11-30"),
      quantity: 150,
      costPrice: 35,
      sellingPrice: 45,
      status: "In Stock",
    },
    {
      medicineId: getMedId("Omeprazole 20mg"),
      batchNo: "O104/1",
      expiry: ts("2027-06-15"),
      quantity: 200,
      costPrice: 12,
      sellingPrice: 20,
      status: "In Stock",
    },
    {
      medicineId: getMedId("DC Examination Gloves"),
      batchNo: "D103/1",
      expiry: ts("2029-01-01"),
      quantity: 1200,
      costPrice: 30,
      sellingPrice: 45,
      status: "In Stock",
    },
  ];

  for (const b of batchesData) {
    await addDoc(collection(db, "stockBatches"), {
      ...b,
      createdAt: ts("2024-01-01"),
    });
  }
  console.log(`✓ Seeded ${batchesData.length} stock batches`);

  // 4. Seed Sales (New Transaction Schema)
  const salesData = [
    {
      invoiceNumber: "INV-1001",
      date: "05/01/2026",
      createdAt: ts("2026-05-01T08:30:00"),
      status: "Completed",
      paymentMethod: "Cash",
      total: 450,
      items: [
        {
          name: "Amoxicillin 500mg",
          batchNo: "A104/1",
          quantity: 18,
          price: 25,
          total: 450,
        },
      ],
    },
    {
      invoiceNumber: "INV-1002",
      date: "04/12/2026",
      createdAt: ts("2026-04-12T13:45:00"),
      status: "Completed",
      paymentMethod: "Telebirr",
      total: 75,
      items: [
        {
          name: "Paracetamol 500mg",
          batchNo: "P204/1",
          quantity: 5,
          price: 15,
          total: 75,
        },
      ],
    },
    {
      invoiceNumber: "INV-1003",
      date: "03/05/2026",
      createdAt: ts("2026-03-05T10:15:00"),
      status: "Completed",
      paymentMethod: "Cash",
      total: 900,
      items: [
        {
          name: "Atorvastatin 20mg",
          batchNo: "A403/1",
          quantity: 10,
          price: 45,
          total: 450,
        },
        {
          name: "Omeprazole 20mg",
          batchNo: "O104/1",
          quantity: 22.5,
          price: 20,
          total: 450,
        },
      ],
    },
    {
      invoiceNumber: "INV-1004",
      date: "02/19/2026",
      createdAt: ts("2026-02-19T11:30:00"),
      status: "Completed",
      paymentMethod: "CBE Birr",
      total: 1350,
      items: [
        {
          name: "Atorvastatin 20mg",
          batchNo: "A403/1",
          quantity: 30,
          price: 45,
          total: 1350,
        },
      ],
    },
    {
      invoiceNumber: "INV-1005",
      date: "01/07/2026",
      createdAt: ts("2026-01-07T09:00:00"),
      status: "Completed",
      paymentMethod: "Cash",
      total: 225,
      items: [
        {
          name: "DC Examination Gloves",
          batchNo: "D103/1",
          quantity: 5,
          price: 45,
          total: 225,
        },
      ],
    },
  ];

  for (const s of salesData) {
    await addDoc(collection(db, "sales"), s);
  }
  console.log(`✓ Seeded ${salesData.length} sales records`);

  // 5. Global Settings
  await setDoc(doc(db, "settings", "global"), {
    lowStockThreshold: 10,
    expiryWarningDays: 60,
    currency: "ETB",
    language: "en",
  });
  console.log("✓ Seeded global settings");

  console.log("\n🎉 Seeding complete! Your new architecture is ready.");
};

main().catch((err) => {
  console.error("Seeding failed:", err.message || err);
  process.exit(1);
});
