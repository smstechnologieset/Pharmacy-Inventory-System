const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Supplier service request failed");
  }
  return data;
};

export const createSupplier = async (supplier, pharmacyId) => {
  try {
    const response = await fetch(`${API_URL}/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const url = new URL(`${API_URL}/suppliers`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString());
    return await handleResponse(response);
  } catch (error) {
    console.error("Error loading suppliers:", error);
    throw new Error(`Failed to load suppliers: ${error.message}`);
  }
};

export const updateSupplier = async (supplierId, updates, pharmacyId) => {
  try {
    const url = new URL(`${API_URL}/suppliers/${supplierId}`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
    const url = new URL(`${API_URL}/suppliers/${supplierId}`);
    if (pharmacyId) url.searchParams.append("pharmacyId", pharmacyId);

    const response = await fetch(url.toString(), {
      method: "DELETE",
    });
    await handleResponse(response);
    return supplierId;
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw new Error(`Failed to delete supplier: ${error.message}`);
  }
};
