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
} from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = path.resolve(__dirname, "../.env.local");

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

// ── Helper: create a Firestore Timestamp from a plain date ───────────────────
const ts = (dateStr) => Timestamp.fromDate(new Date(dateStr));

// ── 30 realistic pharmacy sales records spanning 2020 – 2026 ─────────────────
const salesData = [
  // 2020
  {
    invoiceId: "INV-2001",
    item: "Amoxicillin 500mg",
    batch: "A101/1",
    category: "Antibiotics",
    quantity: 30,
    amount: 450,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2020-02-14T09:15:00"),
  },
  {
    invoiceId: "INV-2002",
    item: "Paracetamol 500mg",
    batch: "P201/1",
    category: "Analgesics",
    quantity: 50,
    amount: 125,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2020-04-03T11:30:00"),
  },
  {
    invoiceId: "INV-2003",
    item: "Metformin 850mg",
    batch: "M301/1",
    category: "Diabetes",
    quantity: 60,
    amount: 780,
    payment: "CBE",
    status: "Delivered",
    createdAt: ts("2020-06-20T14:00:00"),
  },
  {
    invoiceId: "INV-2004",
    item: "Atorvastatin 20mg",
    batch: "A401/1",
    category: "Cardiovascular",
    quantity: 30,
    amount: 620,
    payment: "Telebirr",
    status: "Delivered",
    createdAt: ts("2020-08-11T10:45:00"),
  },
  {
    invoiceId: "INV-2005",
    item: "Omeprazole 20mg",
    batch: "O101/1",
    category: "Gastro",
    quantity: 28,
    amount: 336,
    payment: "Cash",
    status: "Cancelled",
    createdAt: ts("2020-11-05T08:20:00"),
  },

  // 2021
  {
    invoiceId: "INV-2101",
    item: "Ciprofloxacin 500mg",
    batch: "C201/1",
    category: "Antibiotics",
    quantity: 20,
    amount: 560,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2021-01-18T09:00:00"),
  },
  {
    invoiceId: "INV-2102",
    item: "Ibuprofen 400mg",
    batch: "I101/1",
    category: "Analgesics",
    quantity: 40,
    amount: 280,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2021-03-22T13:15:00"),
  },
  {
    invoiceId: "INV-2103",
    item: "Lisinopril 10mg",
    batch: "L201/1",
    category: "Cardiovascular",
    quantity: 30,
    amount: 540,
    payment: "CBE",
    status: "Delivered",
    createdAt: ts("2021-05-14T10:30:00"),
  },
  {
    invoiceId: "INV-2104",
    item: "Metformin 500mg",
    batch: "M302/1",
    category: "Diabetes",
    quantity: 90,
    amount: 900,
    payment: "Telebirr",
    status: "Delivered",
    createdAt: ts("2021-07-30T15:00:00"),
  },
  {
    invoiceId: "INV-2105",
    item: "DC Examination Gloves",
    batch: "D101/1",
    category: "Supplies",
    quantity: 100,
    amount: 750,
    payment: "Cash",
    status: "Pending",
    createdAt: ts("2021-10-09T09:45:00"),
  },

  // 2022
  {
    invoiceId: "INV-2201",
    item: "Amoxicillin 250mg",
    batch: "A102/1",
    category: "Antibiotics",
    quantity: 60,
    amount: 540,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2022-01-12T08:30:00"),
  },
  {
    invoiceId: "INV-2202",
    item: "Tonact 40mg",
    batch: "T101/1",
    category: "Cardiovascular",
    quantity: 30,
    amount: 900,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2022-03-25T11:00:00"),
  },
  {
    invoiceId: "INV-2203",
    item: "Clopilet 75mg",
    batch: "C301/1",
    category: "Cardiovascular",
    quantity: 30,
    amount: 1050,
    payment: "Telebirr",
    status: "Delivered",
    createdAt: ts("2022-06-07T14:30:00"),
  },
  {
    invoiceId: "INV-2204",
    item: "Paracetamol 650mg",
    batch: "P202/1",
    category: "Analgesics",
    quantity: 100,
    amount: 300,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2022-08-19T10:00:00"),
  },
  {
    invoiceId: "INV-2205",
    item: "Omeprazole 40mg",
    batch: "O102/1",
    category: "Gastro",
    quantity: 30,
    amount: 480,
    payment: "CBE",
    status: "Cancelled",
    createdAt: ts("2022-11-30T16:15:00"),
  },

  // 2023
  {
    invoiceId: "INV-2301",
    item: "Azithromycin 500mg",
    batch: "A501/1",
    category: "Antibiotics",
    quantity: 15,
    amount: 675,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2023-02-08T09:30:00"),
  },
  {
    invoiceId: "INV-2302",
    item: "Amlodipine 5mg",
    batch: "A601/1",
    category: "Cardiovascular",
    quantity: 30,
    amount: 420,
    payment: "Telebirr",
    status: "Delivered",
    createdAt: ts("2023-04-17T13:00:00"),
  },
  {
    invoiceId: "INV-2303",
    item: "Metformin 1000mg",
    batch: "M303/1",
    category: "Diabetes",
    quantity: 60,
    amount: 960,
    payment: "CBE",
    status: "Delivered",
    createdAt: ts("2023-07-03T11:45:00"),
  },
  {
    invoiceId: "INV-2304",
    item: "Ibuprofen 600mg",
    batch: "I102/1",
    category: "Analgesics",
    quantity: 50,
    amount: 500,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2023-09-21T10:15:00"),
  },
  {
    invoiceId: "INV-2305",
    item: "DC Examination Gloves",
    batch: "D102/1",
    category: "Supplies",
    quantity: 200,
    amount: 1400,
    payment: "Cash",
    status: "Pending",
    createdAt: ts("2023-12-05T08:00:00"),
  },

  // 2024
  {
    invoiceId: "INV-2401",
    item: "Ciprofloxacin 250mg",
    batch: "C202/1",
    category: "Antibiotics",
    quantity: 20,
    amount: 380,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2024-01-29T09:00:00"),
  },
  {
    invoiceId: "INV-2402",
    item: "Atorvastatin 40mg",
    batch: "A402/1",
    category: "Cardiovascular",
    quantity: 30,
    amount: 870,
    payment: "CBE",
    status: "Delivered",
    createdAt: ts("2024-03-14T14:00:00"),
  },
  {
    invoiceId: "INV-2403",
    item: "Paracetamol 500mg",
    batch: "P203/1",
    category: "Analgesics",
    quantity: 80,
    amount: 200,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2024-05-22T10:30:00"),
  },
  {
    invoiceId: "INV-2404",
    item: "Lisinopril 20mg",
    batch: "L202/1",
    category: "Cardiovascular",
    quantity: 30,
    amount: 660,
    payment: "Telebirr",
    status: "Delivered",
    createdAt: ts("2024-08-08T11:15:00"),
  },
  {
    invoiceId: "INV-2405",
    item: "Omeprazole 20mg",
    batch: "O103/1",
    category: "Gastro",
    quantity: 56,
    amount: 672,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2024-10-17T15:30:00"),
  },

  // 2025
  {
    invoiceId: "INV-2501",
    item: "Amoxicillin 500mg",
    batch: "A103/1",
    category: "Antibiotics",
    quantity: 45,
    amount: 675,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2025-01-10T08:45:00"),
  },
  {
    invoiceId: "INV-2502",
    item: "Azithromycin 250mg",
    batch: "A502/1",
    category: "Antibiotics",
    quantity: 10,
    amount: 350,
    payment: "Telebirr",
    status: "Delivered",
    createdAt: ts("2025-03-28T13:30:00"),
  },
  {
    invoiceId: "INV-2503",
    item: "Metformin 850mg",
    batch: "M304/1",
    category: "Diabetes",
    quantity: 90,
    amount: 1170,
    payment: "CBE",
    status: "Delivered",
    createdAt: ts("2025-06-15T10:00:00"),
  },
  {
    invoiceId: "INV-2504",
    item: "DC Examination Gloves",
    batch: "D103/1",
    category: "Supplies",
    quantity: 150,
    amount: 1125,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2025-09-03T09:15:00"),
  },
  {
    invoiceId: "INV-2505",
    item: "Clopilet 75mg",
    batch: "C302/1",
    category: "Cardiovascular",
    quantity: 30,
    amount: 1050,
    payment: "Cash",
    status: "Pending",
    createdAt: ts("2025-11-20T14:45:00"),
  },

  // 2026
  {
    invoiceId: "INV-2601",
    item: "Ibuprofen 400mg",
    batch: "I103/1",
    category: "Analgesics",
    quantity: 60,
    amount: 420,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2026-01-07T09:00:00"),
  },
  {
    invoiceId: "INV-2602",
    item: "Atorvastatin 20mg",
    batch: "A403/1",
    category: "Cardiovascular",
    quantity: 30,
    amount: 620,
    payment: "CBE",
    status: "Delivered",
    createdAt: ts("2026-02-19T11:30:00"),
  },
  {
    invoiceId: "INV-2603",
    item: "Paracetamol 500mg",
    batch: "P204/1",
    category: "Analgesics",
    quantity: 100,
    amount: 250,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2026-03-05T10:15:00"),
  },
  {
    invoiceId: "INV-2604",
    item: "Amoxicillin 500mg",
    batch: "A104/1",
    category: "Antibiotics",
    quantity: 30,
    amount: 450,
    payment: "Telebirr",
    status: "Delivered",
    createdAt: ts("2026-04-12T13:45:00"),
  },
  {
    invoiceId: "INV-2605",
    item: "Omeprazole 40mg",
    batch: "O104/1",
    category: "Gastro",
    quantity: 28,
    amount: 448,
    payment: "Cash",
    status: "Delivered",
    createdAt: ts("2026-05-01T08:30:00"),
  },
];

const abort = (msg) => {
  console.error(msg);
  process.exit(1);
};

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

  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) abort(`Missing Firebase config: ${missing.join(", ")}`);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log(`\nSeeding ${salesData.length} sales records...\n`);

  for (const sale of salesData) {
    const doc = {
      invoiceId: sale.invoiceId,
      item: sale.item,
      batch: sale.batch,
      category: sale.category,
      quantity: Number(sale.quantity),
      amount: Number(sale.amount),
      payment: sale.payment,
      status: sale.status,
      createdAt: sale.createdAt, // real historical Timestamp
      updatedAt: sale.createdAt, // same as createdAt for seeded data
    };

    const ref = await addDoc(collection(db, "sales"), doc);
    console.log(
      `  ✓ ${sale.createdAt.toDate().getFullYear()}  ${sale.item.padEnd(28)} ETB ${String(sale.amount).padStart(6)}  →  sales/${ref.id}`,
    );
  }

  console.log("\nSeeding complete.");
};

main().catch((err) => {
  console.error("Seeding failed:", err.message || err);
  process.exit(1);
});
