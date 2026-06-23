import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const getSystemSettings = async (pharmacyId) => {
  try {
    const settingsId = pharmacyId || "global";
    const docRef = doc(db, "settings", settingsId);
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
    const settingsId = pharmacyId || "global";
    const docRef = doc(db, "settings", settingsId);
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
