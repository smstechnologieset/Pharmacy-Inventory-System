// 🚨 CRITICAL: Import the EXACT same auth instance used by AuthContext
import { auth } from "./firebase"; 

/**
 * Gets the Firebase ID token and formats it for backend API requests.
 * Now uses the exact same auth instance as the rest of your app.
 */
export const getAuthHeaders = async (timeoutMs = 5000) => {
  console.log("🔍 [API HELPER] Checking auth state...");
  console.log("🔍 [API HELPER] auth.currentUser:", auth.currentUser?.uid || "NULL");

  // 1. If user is already loaded, return immediately
  if (auth.currentUser) {
    console.log("✅ [API HELPER] User found instantly. Fetching token...");
    try {
      const token = await auth.currentUser.getIdToken();
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      console.error("❌ [API HELPER] Failed to get ID token:", error);
      throw new Error("Failed to get authentication token.");
    }
  }

  // 2. Otherwise, wait for Firebase to restore the session
  console.warn("⚠️ [API HELPER] currentUser is NULL. Waiting for onAuthStateChanged...");
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      console.error("❌ [API HELPER] TIMEOUT: User still not logged in after 5 seconds.");
      reject(new Error("User is not logged in. Cannot make authenticated API requests."));
    }, timeoutMs);

    // 🚨 Use the exact same auth instance
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("🔔 [API HELPER] onAuthStateChanged fired. User:", user?.uid || "NULL");
      
      if (user) {
        clearTimeout(timeout);
        unsubscribe();
        try {
          console.log("✅ [API HELPER] User restored! Fetching token...");
          const token = await user.getIdToken();
          resolve({
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          });
        } catch (error) {
          console.error("❌ [API HELPER] Failed to get ID token after restore:", error);
          reject(new Error("Failed to get authentication token."));
        }
      }
    });
  });
};
