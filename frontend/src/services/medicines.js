import { query, where, onSnapshot } from "firebase/firestore";
import { MEDICINES_COLLECTION } from "./collections";
import { tenantCollection } from "./firestorePaths.js";
import { getAuthHeaders } from "./apiHelper.js";

const API_URL = import.meta.env.VITE_API_URL || "https://pharmacy-inventory-system-production-6e12.up.railway.app/api";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Medicine service request failed");
  }
  return data;
};

export const createMedicine = async (medicine, pharmacyId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/medicines`, {
      method: "POST",
      headers,
      body: JSON.stringify({ medicine, pharmacyId }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error creating medicine:", error);
    throw new Error(`Failed to create medicine: ${error.message}`);
  }
};

export const getAllMedicines = async (pharmacyId) => {
  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/medicines`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString(), { headers });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error loading medicines:", error);
    throw new Error(`Failed to load medicines: ${error.message}`);
  }
};

export const getMedicineById = async (medicineId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/medicines/${medicineId}`, { headers });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching medicine:", error);
    throw new Error(`Failed to fetch medicine: ${error.message}`);
  }
};

export const searchMedicinesByPrefix = async (pharmacyId, prefix) => {
  if (!prefix || prefix.length === 0) return [];

  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/medicines/search`);
    url.searchParams.append("prefix", prefix);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString(), { headers });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error searching medicines:", error);
    throw new Error(`Failed to search medicines: ${error.message}`);
  }
};

export const updateMedicine = async (medicineId, updates, pharmacyId) => {
  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/medicines/${medicineId}`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString(), {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error updating medicine:", error);
    throw new Error(`Failed to update medicine: ${error.message}`);
  }
};

export const deleteMedicine = async (medicineId, pharmacyId) => {
  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/medicines/${medicineId}`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers,
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error deleting medicine:", error);
    throw new Error(`Failed to delete medicine: ${error.message}`);
  }
};

export const subscribeToMedicines = (pharmacyId, callback) => {
  if (!pharmacyId) {
    console.warn("subscribeToMedicines skipped: pharmacyId is required");
    callback([]);
    return () => {};
  }

  const q = query(
    tenantCollection(pharmacyId, MEDICINES_COLLECTION),
    where("isDeleted", "==", false),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const medicines = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(medicines);
    },
    (error) => {
      console.error("Error in medicines subscription:", error);
    },
  );
};
