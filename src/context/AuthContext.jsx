/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  createUserWithEmailAndPassword as signUp,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
// import {
//   createUserProfile,
//   getUserProfile,
//   getPharmacyById,
//   createPharmacy,
// } from "../services/firestoreService";
import { doc, onSnapshot } from "firebase/firestore";
import { createPharmacy, getPharmacyById } from "../services/pharmacies.js";
import { createUserProfile, getUserProfile } from "../services/users.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [pharmacyStatus, setPharmacyStatus] = useState(null);
  const isSigningUp = useRef(false);

  // Listen for auth state changes (persistent login)
  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        setAuthUser(firebaseUser);
        setLoading(true);

        const userDocRef = doc(db, "users", firebaseUser.uid);

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              isSigningUp.current = false;
              const profileData = docSnap.data();

              if (profileData.role !== "superadmin" && profileData.pharmacyId) {
                try {
                  const pharmacy = await getPharmacyById(
                    profileData.pharmacyId,
                  );
                  setPharmacyStatus(pharmacy.status || "active");
                } catch {
                  setPharmacyStatus("active");
                }
              } else {
                setPharmacyStatus("active");
              }

              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...profileData,
              });
              setError(null);
            } else {
              // Doc doesn't exist — skip logout if we're mid-signup
              if (!isSigningUp.current) {
                console.warn(
                  "User profile missing or deleted. Forcing logout.",
                );
                signOut(auth).catch(console.error);
                setUser(null);
                setError(
                  "Your account has been removed or disabled by an administrator.",
                );
              }
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

  const signup = async (
    email,
    password,
    name = "",
    role = "admin",
    phone = "",
    pharmacyName = "",
  ) => {
    setLoading(true);
    setError(null);
    isSigningUp.current = true;
    try {
      const userCredential = await signUp(auth, email, password);
      const firebaseUser = userCredential.user;
 await sendEmailVerification(firebaseUser);
      // 1. Create pharmacy doc first to get the pharmacyId
      const pharmacy = await createPharmacy({
        name: pharmacyName,
        phone,
        email,
        adminUid: firebaseUser.uid,
        adminId: firebaseUser.uid,
        status: "pending",
      });
      // console.log("pharmacy created:", pharmacy.id);

      // 2. Create user profile with the pharmacyId linked
      await createUserProfile(firebaseUser.uid, {
        email,
        name,
        role,
        phone,
        pharmacyName,
        pharmacyId: pharmacy.id,
        status: "pending",
      });

      return firebaseUser;
    } catch (err) {
      setError(err.message || "Signup failed");
      isSigningUp.current = false;
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const resendVerificationEmail = async () => {
    setError(null);
    try {
      if (!authUser) throw new Error("No authenticated user found.");
      if (authUser.emailVerified) throw new Error("Email is already verified.");
      await sendEmailVerification(authUser);
    } catch (err) {
      setError(err.message || "Failed to resend verification email.");
      throw err;
    }
  };

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

    // Block unverified users from logging in
    if ( !firebaseUser.emailVerified ) {
      
      await signOut(auth);
      throw new Error("Please verify your email before logging in.");
    }

    const userProfile = await getUserProfile(firebaseUser.uid);
    setAuthUser(firebaseUser);
    setUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      ...userProfile,
    });
    return firebaseUser;
  } catch (err) {
    setError(err.message || "Login failed");
    throw err;
  } finally {
    setLoading(false);
  }
};

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setAuthUser(null);
      setUser(null);
      setPharmacyStatus(null);
    } catch (err) {
      setError(err.message || "Logout failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

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
        resendVerificationEmail,
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

export const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) return null;
  return children;
};
