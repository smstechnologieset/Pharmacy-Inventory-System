import { collection, doc } from "firebase/firestore";
import { db } from "./firebase.js";

export const tenantRoot = (pharmacyId) => {
  if (!pharmacyId) throw new Error("pharmacyId is required for tenantRoot");
  return doc(db, "pharmacies", pharmacyId);
};

export const tenantCollection = (pharmacyId, subcollection) => {
  if (!pharmacyId)
    throw new Error("pharmacyId is required for tenantCollection");
  if (!subcollection)
    throw new Error("subcollection is required for tenantCollection");
  return collection(db, "pharmacies", pharmacyId, subcollection);
};

export const tenantDoc = (pharmacyId, subcollection, docId) => {
  if (!pharmacyId) throw new Error("pharmacyId is required for tenantDoc");
  if (!subcollection)
    throw new Error("subcollection is required for tenantDoc");
  if (!docId) throw new Error("docId is required for tenantDoc");
  return doc(db, "pharmacies", pharmacyId, subcollection, docId);
};

export const memberDoc = (pharmacyId, userId) =>
  tenantDoc(pharmacyId, "members", userId);

export const settingsDoc = (pharmacyId, settingsId = "settings") =>
  tenantDoc(pharmacyId, "settings", settingsId);

export const tenantSettingsCollection = (pharmacyId) =>
  tenantCollection(pharmacyId, "settings");

export const tenantStatsCollection = (pharmacyId) =>
  tenantCollection(pharmacyId, "stats");
