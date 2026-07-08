import { auth } from "./firebase";

export const getAuthHeaders = async () => {
  if (!navigator.onLine) {
    throw new Error("You appear to be offline.");
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("User is not authenticated.");
  }

  try {
    const token = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error("❌ [ADMIN API] Failed to get ID token:", error);
    throw new Error("Failed to get authentication token.");
  }
};