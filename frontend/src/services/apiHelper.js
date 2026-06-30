import { getAuth } from "firebase/auth";

/**
 * Automatically fetches the current user's Firebase ID token 
 * and returns the headers required for backend API calls.
 */
export const getAuthHeaders = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error("User is not logged in. Cannot make authenticated API requests.");
  }
  
  // Get the fresh Firebase ID token (valid for 1 hour)
  const token = await user.getIdToken();
  
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` // This is what your backend middleware expects!
  };
};
