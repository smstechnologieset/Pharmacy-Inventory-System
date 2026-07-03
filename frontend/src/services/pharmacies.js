import { onSnapshot } from "firebase/firestore";
import { tenantDoc } from "./firestorePaths.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Pharmacy service request failed");
  }
  return data;
};

export const createPharmacy = async (pharmacyData) => {
  try {
    const response = await fetch(`${API_URL}/pharmacies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pharmacyData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error creating pharmacy:", error);
    throw new Error(`Failed to create pharmacy: ${error.message}`);
  }
};

export const getAllPharmacies = async () => {
  try {
    const response = await fetch(`${API_URL}/pharmacies`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error loading pharmacies:", error);
    throw new Error(`Failed to load pharmacies: ${error.message}`);
  }
};

export const getPharmacyById = async (pharmacyId) => {
  try {
    const response = await fetch(`${API_URL}/pharmacies/${pharmacyId}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching pharmacy:", error);
    throw new Error(`Failed to fetch pharmacy: ${error.message}`);
  }
};

export const updatePharmacy = async (pharmacyId, updates) => {
  try {
    const response = await fetch(`${API_URL}/pharmacies/${pharmacyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error updating pharmacy:", error);
    throw new Error(`Failed to update pharmacy: ${error.message}`);
  }
};

export const updateUserStatusByPharmacyId = async (pharmacyId, status) => {
  try {
    const response = await fetch(
      `${API_URL}/pharmacies/${pharmacyId}/user-status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    return await handleResponse(response);
  } catch (error) {
    console.error("Error updating user status:", error);
    throw new Error(`Failed to update user status: ${error.message}`);
  }
};


export const subscribeToPharmacyStats = (pharmacyId, callback) => {
  const q = tenantDoc(pharmacyId, "stats", "pharmacy");
  return onSnapshot(q, (snap) => {
    callback(
      snap.exists() ? snap.data() : { totalRevenue: 0, totalSalesCount: 0 },
    );
  });
};
