import { getAuthHeaders } from "./apiHelper.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create a new staff member (Calls Backend to check User Quotas)
export const createStaffAccount = async (
  userData,
  pharmacyId,
  pharmacyName,
  createdBy,
) => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_URL}/staff/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        pharmacyId, 
        pharmacyName,
        createdBy,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const error = new Error(result.error || "Failed to create staff");
      if (result.error === "auth/email-already-in-use") {
        error.code = "auth/email-already-in-use";
      }
      throw error;
    }

    return { uid: result.uid, password: result.password };
  } catch (error) {
    console.error("Frontend service error creating staff:", error);
    throw error;
  }
};

// Disable staff (Calls Backend to disable in Firebase Auth)
export const disableStaff = async (userId) => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/staff/disable/${userId}`, {      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to disable staff');
    }
    return userId;
  } catch (error) {
    console.error('Error disabling staff:', error);
    throw error;
  }
};

// Hard delete staff (Calls Backend to free up User Quota seat)
export const hardDeleteStaff = async (userId) => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/staff/hard-delete/${userId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete staff');
    }
    return userId;
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
};

// Re-enable staff (Calls Backend to re-enable in Firebase Auth)
export const enableStaff = async (userId) => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/staff/enable/${userId}`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to enable staff');
    }    return userId;
  } catch (error) {
    console.error('Error enabling staff:', error);
    throw error;
  }
};

// 🆕 UPDATE STAFF (Calls Backend to update Role and sync Firebase Custom Claims)
export const updateStaffProfile = async (userId, updates) => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/staff/${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to update staff');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating staff:', error);
    throw error;
  }
};
