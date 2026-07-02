import { auth } from "./firebase";

export const getAuthHeaders = async (timeoutMs = 15000) => {
  console.log("🔍 [API HELPER] Checking auth state...");
  console.log("🔍 [API HELPER] auth.currentUser:", auth.currentUser?.uid || "NULL");

  // Fail fast with a clear message if the browser knows it's offline
  if (!navigator.onLine) {
    throw new Error("You appear to be offline. Please check your connection and try again.");
  }

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
    const cleanup = () => {
      clearTimeout(timeout);
      unsubscribe();
      window.removeEventListener("offline", handleOffline);
    };

    const handleOffline = () => {
      console.error("❌ [API HELPER] Connection dropped while waiting for auth.");
      cleanup();
      reject(new Error("Connection lost while signing in. Please check your network and try again."));
    };

    const timeout = setTimeout(() => {
      console.error(`❌ [API HELPER] TIMEOUT: User still not logged in after ${timeoutMs / 1000}s.`);
      cleanup();
      reject(new Error("This is taking longer than expected. Your connection may be unstable — please try again."));
    }, timeoutMs);

    window.addEventListener("offline", handleOffline);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("🔔 [API HELPER] onAuthStateChanged fired. User:", user?.uid || "NULL");

      if (user) {
        cleanup();
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
