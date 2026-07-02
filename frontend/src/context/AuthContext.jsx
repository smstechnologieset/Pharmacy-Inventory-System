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
import { doc, onSnapshot } from "firebase/firestore";
import { getPharmacyById } from "../services/pharmacies.js";
import { createUserProfile, getUserProfile } from "../services/users.js";
import { memberDoc } from "../services/firestorePaths.js";
import { getAuthHeaders } from "../services/apiHelper.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [pharmacyStatus, setPharmacyStatus] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // 🆕 NEW STATE
  const isSigningUp = useRef(false);

  useEffect(() => {
    let unsubscribeSnapshot = null;
    let unsubscribeMemberSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeMemberSnapshot) unsubscribeMemberSnapshot();

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

              const setProfile = async (memberData = {}) => {
                const effectiveProfile = {
                  ...profileData,
                  ...memberData,
                  pharmacyId: memberData.pharmacyId || profileData.pharmacyId,
                };

                if (
                  effectiveProfile.role !== "superadmin" &&
                  effectiveProfile.pharmacyId
                ) {
                  try {
                    const pharmacy = await getPharmacyById(
                      effectiveProfile.pharmacyId,
                    );

                    // 🆕 EXTRACT BOTH STATUSES
                    setPharmacyStatus(pharmacy.status || "pending");
                    setSubscriptionStatus(
                      pharmacy.subscription?.status || "pending_payment",
                    );
                  } catch (err) {
                    console.error("Error fetching pharmacy:", err);
                    setPharmacyStatus("pending");
                    setSubscriptionStatus("pending_payment");
                  }
                } else {
                  setPharmacyStatus("active");
                  setSubscriptionStatus("active");
                }

                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  ...effectiveProfile,
                });
                setError(null);
                setLoading(false);
              };

              if (profileData.role !== "superadmin" && profileData.pharmacyId) {
                if (unsubscribeMemberSnapshot) unsubscribeMemberSnapshot();
                unsubscribeMemberSnapshot = onSnapshot(
                  memberDoc(profileData.pharmacyId, firebaseUser.uid),
                  (memberSnap) => {
                    if (memberSnap.exists()) setProfile(memberSnap.data());
                    else setProfile();
                  },
                  (err) => {
                    console.error("Error listening to member profile:", err);
                    setProfile();
                  },
                );
              } else {
                setProfile();
              }
            } else {
              if (!isSigningUp.current) {
                signOut(auth).catch(console.error);
                setUser(null);
                setPharmacyStatus(null);
                setSubscriptionStatus(null);
                setError("Your account has been removed or disabled.");
              }
            }
            if (!docSnap.exists()) setLoading(false);
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
        setSubscriptionStatus(null); // 🆕 RESET
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeMemberSnapshot) unsubscribeMemberSnapshot();
    };
  }, []);

  const createAccount = async (email, password, name, phone) => {
    setLoading(true);
    setError(null);
    isSigningUp.current = true;
    try {
      const userCredential = await signUp(auth, email, password);
      const firebaseUser = userCredential.user;
      await sendEmailVerification(firebaseUser);
      await createUserProfile(firebaseUser.uid, {
        email,
        name,
        role: "admin",
        phone: `+251${phone}`,
        status: "pending_onboarding",
        pharmacyId: null,
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

  const finalizeRegistration = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/auth/complete-registration`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to complete registration");
      if (auth.currentUser) await auth.currentUser.getIdToken(true);
      return result;
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
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
      if (!firebaseUser.emailVerified) throw new Error("__unverified__");
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
      setSubscriptionStatus(null); // 🆕 RESET
    } catch (err) {
      setError(err.message || "Logout failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        loading,
        error,
        createAccount,
        finalizeRegistration,
        login,
        logout,
        clearError: () => setError(null),
        isSuperAdmin: user?.role === "superadmin",
        pharmacyStatus,
        subscriptionStatus, // 🆕 EXPOSE THIS
        resendVerificationEmail: async () => {
          if (authUser && !authUser.emailVerified)
            await sendEmailVerification(authUser);
        },
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
