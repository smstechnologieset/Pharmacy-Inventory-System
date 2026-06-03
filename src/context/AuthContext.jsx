/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
createUserWithEmailAndPassword as signUp,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import {
  createUserProfile,
  getUserProfile,
  getPharmacyById,
} from "../services/firestoreService";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authUser, setAuthUser] = useState(null); // Firebase user object
  const [pharmacyStatus, setPharmacyStatus] = useState(null); // 'active', 'suspended', or null

  // Listen for auth state changes (persistent login)
  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous snapshot listener if auth state changes
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        setAuthUser(firebaseUser);
        setLoading(true);

        const userDocRef = doc(db, "users", firebaseUser.uid);

        // 🔥 REAL-TIME LISTENER: Watches the Firestore profile
        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data();

              // Check pharmacy suspension for non-superadmin users
              if (profileData.role !== "superadmin" && profileData.pharmacyId) {
                try {
                  const pharmacy = await getPharmacyById(profileData.pharmacyId);
                  setPharmacyStatus(pharmacy.status || "active");
                } catch {
                  setPharmacyStatus("active"); // Fallback if pharmacy doc not found
                }
              } else {
                setPharmacyStatus("active");
              }

              // Profile exists, log them in
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...profileData,
              });
              setError(null);
            } else {
              // 🔥 PROFILE WAS DELETED! Force logout immediately.
              console.warn("User profile missing or deleted. Forcing logout.");
              signOut(auth).catch(console.error);
              setUser(null);
              setError(
                "Your account has been removed or disabled by an administrator.",
              );
            }
            setLoading(false);
          },
          (err) => {
            console.error("Error listening to user profile:", err);
            setError("Failed to verify account status.");
            setLoading(false);
          },
        );
      } else {
        setAuthUser(null);
        setUser(null);
        setPharmacyStatus(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);
  /**
   * Sign up with email and password
   * Creates auth user and Firestore profile
   */
  const signup = async (email, password, name = "", role = "staff") => {
    setLoading(true);
    setError(null);
    try {
      // Create Firebase Auth user
      const userCredential = await signUp(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create Firestore user profile
      await createUserProfile(firebaseUser.uid, {
        email,
        name,
        role,
      });

      // Fetch and set the profile
      const userProfile = await getUserProfile(firebaseUser.uid);
      setAuthUser(firebaseUser);
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userProfile,
      });

      return firebaseUser;
    } catch (err) {
      const errorMessage = err.message || "Signup failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Fetch Firestore profile
      const userProfile = await getUserProfile(firebaseUser.uid);
      setAuthUser(firebaseUser);
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userProfile,
      });

      return firebaseUser;
    } catch (err) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setAuthUser(null);
      setUser(null);
      setPharmacyStatus(null);
    } catch (err) {
      const errorMessage = err.message || "Logout failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  const isSuperAdmin = user?.role === "superadmin";

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        loading,
        error,
        login,
        signup,
        logout,
        clearError,
        isSuperAdmin,
        pharmacyStatus,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Role wrapper component
export const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
};
