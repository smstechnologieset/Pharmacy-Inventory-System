import { getAuthHeaders } from "./apiHelper.js";

const API_URL = import.meta.env.VITE_API_URL || "https://pharmacy-inventory-system-production-6e12.up.railway.app/api";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Supplier service request failed");
  }
  return data;
};

export const createSupplier = async (supplier, pharmacyId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/suppliers`, {
      method: "POST",
      headers,
      body: JSON.stringify({ supplier, pharmacyId }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw new Error(`Failed to create supplier: ${error.message}`);
  }
};

export const getAllSuppliers = async (pharmacyId) => {
  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/suppliers`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString(), { headers });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error loading suppliers:", error);
    throw new Error(`Failed to load suppliers: ${error.message}`);
  }
};

export const updateSupplier = async (supplierId, updates, pharmacyId) => {
  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/suppliers/${supplierId}`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString(), {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error updating supplier:", error);
    throw new Error(`Failed to update supplier: ${error.message}`);
  }
};

export const deleteSupplier = async (supplierId, pharmacyId) => {
  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/suppliers/${supplierId}`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers,
    });
    await handleResponse(response);
    return supplierId;
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw new Error(`Failed to delete supplier: ${error.message}`);
  }
};
