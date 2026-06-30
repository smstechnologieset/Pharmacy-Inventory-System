import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { settingsDoc } from "./firestorePaths.js";

export const getSystemSettings = async (pharmacyId) => {
  try {
    const docRef = pharmacyId
      ? settingsDoc(pharmacyId)
      : doc(db, "settings", "global");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data();

    const defaults = {
      lowStockThreshold: 10,
      expiryWarningDays: 60,
      currency: "ETB",
      language: "en",
      pharmacyId,
    };
    await setDoc(docRef, defaults);
    return defaults;
  } catch (error) {
    console.error("Error loading settings:", error);
    return { lowStockThreshold: 10, expiryWarningDays: 60 };
  }
};

export const updateSystemSettings = async (updates, pharmacyId) => {
  try {
    const docRef = pharmacyId
      ? settingsDoc(pharmacyId)
      : doc(db, "settings", "global");
    await setDoc(
      docRef,
      { ...updates, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return true;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw new Error("Failed to save settings");
  }
};
