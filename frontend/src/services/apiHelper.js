/* eslint-disable react-refresh/only-export-components */
// frontend/src/services/notification/apiHelper.jsx
 // ⚠️ Verify this path matches your firebase config location

import { auth } from "./firebase.js";

export const getAuthHeaders = async () => {
  // 1. Check internet connection
  if (!navigator.onLine) {
    throw new Error("You appear to be offline. Please check your connection.");
  }

  // 2. Get the current user or wait for restoration
  let user = auth.currentUser;
  if (!user) {
    await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        user = u;
        unsubscribe();
        resolve();
      });
      setTimeout(() => {
        unsubscribe();
        resolve();
      }, 2500);
    });
  }

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  try {
    // 3. Fetch the token (this handles refresh automatically)
    const token = await user.getIdToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error("❌ [API HELPER] Failed to get ID token:", error);
    throw new Error("Failed to get authentication token.");
  }
};

// import { auth } from "./firebase.js";

// export const getAuthHeaders = async () => {
//   if (!navigator.onLine) {
//     throw new Error("You appear to be offline.");
//   }

//   const user = auth.currentUser;

//   // If user is null, they are logged out. Do not wait for listeners.
//   if (!user) {
//     throw new Error("User is not authenticated.");
//   }

//   try {
//     // Force refresh if token is expired or we need new claims
//     const token = await user.getIdToken();
//     console.log(`user token`, token);
//     return {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     };
//   } catch (error) {
//     console.error("Token fetch failed:", error);
//     throw new Error("Failed to get authentication token.");
//   }
// };

// import { auth } from "./firebase";

// export const getAuthHeaders = async (timeoutMs = 15000) => {
//   console.log("🔍 [API HELPER] Checking auth state...");
//   console.log("🔍 [API HELPER] auth.currentUser:", auth.currentUser?.uid || "NULL");

//   // Fail fast with a clear message if the browser knows it's offline
//   if (!navigator.onLine) {
//     throw new Error("You appear to be offline. Please check your connection and try again.");
//   }

//   // 1. If user is already loaded, return immediately
//   if (auth.currentUser) {
//     console.log("✅ [API HELPER] User found instantly. Fetching token...");
//     try {
//       const token = await auth.currentUser.getIdToken();
//       return {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       };
//     } catch (error) {
//       console.error("❌ [API HELPER] Failed to get ID token:", error);
//       throw new Error("Failed to get authentication token.");
//     }
//   }

//   // 2. Otherwise, wait for Firebase to restore the session
//   console.warn("⚠️ [API HELPER] currentUser is NULL. Waiting for onAuthStateChanged...");

//   return new Promise((resolve, reject) => {
//     const cleanup = () => {
//       clearTimeout(timeout);
//       unsubscribe();
//       window.removeEventListener("offline", handleOffline);
//     };

//     const handleOffline = () => {
//       console.error("❌ [API HELPER] Connection dropped while waiting for auth.");
//       cleanup();
//       reject(new Error("Connection lost while signing in. Please check your network and try again."));
//     };

//     const timeout = setTimeout(() => {
//       console.error(`❌ [API HELPER] TIMEOUT: User still not logged in after ${timeoutMs / 1000}s.`);
//       cleanup();
//       reject(new Error("This is taking longer than expected. Your connection may be unstable — please try again."));
//     }, timeoutMs);

//     window.addEventListener("offline", handleOffline);

//     const unsubscribe = auth.onAuthStateChanged(async (user) => {
//       console.log("🔔 [API HELPER] onAuthStateChanged fired. User:", user?.uid || "NULL");

//       if (user) {
//         cleanup();
//         try {
//           console.log("✅ [API HELPER] User restored! Fetching token...");
//           const token = await user.getIdToken();
//           resolve({
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           });
//         } catch (error) {
//           console.error("❌ [API HELPER] Failed to get ID token after restore:", error);
//           reject(new Error("Failed to get authentication token."));
//         }
//       }
//     });
//   });
// };
