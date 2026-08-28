import { getFirestore } from "./src/config/firebase.js";
import { initializeFirebase } from "./src/config/firebase.js";
import dotenv from "dotenv";

dotenv.config();
initializeFirebase();
const db = getFirestore();

async function check() {
  const settingsDoc = await db.collection("platformSettings").doc("subscriptionTiers").get();
  console.log("TIERS:", JSON.stringify(settingsDoc.data(), null, 2));
  
  const pharmacies = await db.collection("pharmacies").get();
  pharmacies.forEach(doc => {
    console.log("Pharmacy:", doc.id);
    console.log(" - Subscription:", doc.data().subscription);
    console.log(" - Usage:", doc.data().usageMetrics);
  });
  
  process.exit(0);
}
check().catch(console.error);
