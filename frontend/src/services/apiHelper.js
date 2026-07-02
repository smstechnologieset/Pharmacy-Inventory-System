import { getAuth, onAuthStateChanged } from "firebase/auth";

/**
 * Waits for Firebase Auth to restore the session, then returns headers.
 * Prevents "User is not logged in" errors during page transitions.
 */
export const getAuthHeaders = async (timeoutMs = 5000) => {
  const auth = getAuth();

  // If user is already loaded, return immediately
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // Otherwise, wait for Firebase to restore the session
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("User is not logged in. Cannot make authenticated API requests."));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        clearTimeout(timeout);
        unsubscribe();
        try {
          const token = await user.getIdToken();
          resolve({
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          });
        } catch (err) {
          reject(err);
        }
      }
    });
  });
};
