import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
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
import { createUserProfile } from "../services/users.js";
import { memberDoc } from "../services/firestorePaths.js";
import { getAuthHeaders } from "../services/apiHelper.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  // 🆕 distinct from "button loading". This is only true while checking session on app start.
  const [isInitializing, setIsInitializing] = useState(true);

  const [error, setError] = useState(null);
  const [pharmacyStatus, setPharmacyStatus] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const isSigningUp = useRef(false);

  // ---------------------------------------------------------
  // 1. AUTH STATE LISTENER (The "Router" for Auth)
  // ---------------------------------------------------------
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setAuthUser(firebaseUser);
      } else {
        setAuthUser(null);
        setUser(null); // Clear user if logged out
        setPharmacyStatus(null);
        setSubscriptionStatus(null);
      }
      // App initialization is done once we know if a user exists or not
      if (isInitializing) setIsInitializing(false);
    });

    return () => unsubscribeAuth();
  }, [isInitializing]);

  // ---------------------------------------------------------
  // 2. USER PROFILE SYNC (Real-time listener)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!authUser?.uid) return;

    const userDocRef = doc(db, "users", authUser.uid);

    const unsubscribeSnapshot = onSnapshot(
      userDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          isSigningUp.current = false;
          const profileData = docSnap.data();

          // Construct the base user object immediately
          const baseUser = {
            uid: authUser.uid,
            email: authUser.email,
            ...profileData,
          };

          // 🚨 If Superadmin, set status immediately and return
          if (profileData.role === "superadmin") {
            setUser(baseUser);
            setPharmacyStatus("active");
            setSubscriptionStatus("active");
            return;
          }

          // 🚨 Handle Member Data Sync
          if (profileData.role !== "superadmin" && profileData.pharmacyId) {
            const unsubMember = onSnapshot(
              memberDoc(profileData.pharmacyId, authUser.uid),
              (memberSnap) => {
                const memberData = memberSnap.exists() ? memberSnap.data() : {};
                setUser({ ...baseUser, ...memberData });
              },
              (err) => {
                console.error("Member sync error:", err);
                setUser(baseUser); // Fallback to base profile
              },
            );

            // Return cleanup for the inner listener
            return () => unsubMember();
          } else {
            setUser(baseUser);
          }

          setError(null); // Clear errors if we successfully loaded profile
        } else {
          // Doc doesn't exist. Check if we are currently signing up.
          if (!isSigningUp.current) {
            signOut(auth).catch(console.error);
            setUser(null);
            setError("Your account has been removed or disabled.");
          }
        }
      },
      (err) => {
        console.error("Profile listener error:", err);
        setError("Failed to load account details.");
      },
    );

    return () => unsubscribeSnapshot();
  }, [authUser]); // Only re-run when authUser UID changes

  // ---------------------------------------------------------
  // 3. PHARMACY STATUS SYNC (Decoupled Fetch)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!user?.pharmacyId || user.role === "superadmin") return;

    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const pharmacy = await getPharmacyById(user.pharmacyId);

        if (isMounted) {
          setPharmacyStatus(pharmacy?.status || "pending");
          setSubscriptionStatus(
            pharmacy?.subscription?.status || "pending_payment",
          );
        }
      } catch (err) {
        if (isMounted) {
          console.error("Pharmacy fetch error:", err);
          setPharmacyStatus("pending");
          setSubscriptionStatus("pending_payment");
        }
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [user?.pharmacyId, user?.role]);

  // Provide a way to manually refresh pharmacy status after events like payment success
  const refreshPharmacyStatus = async () => {
    if (!user?.pharmacyId || user.role === "superadmin") return;
    try {
      const pharmacy = await getPharmacyById(user.pharmacyId);
      setPharmacyStatus(pharmacy?.status || "pending");
      setSubscriptionStatus(
        pharmacy?.subscription?.status || "pending_payment",
      );
    } catch (err) {
      console.error("Pharmacy fetch error:", err);
    }
  }; // Only re-run when the ID changes

  // ---------------------------------------------------------
  // ACTIONS (No manual setUser calls)
  // ---------------------------------------------------------

  const createAccount = async (email, password, name, phone) => {
    setError(null);
    isSigningUp.current = true; // Flag for the snapshot listener
    try {
      const userCredential = await signUp(auth, email, password);
      await sendEmailVerification(userCredential.user);

      // We don't set the user here. The onAuthStateChanged + onSnapshot
      // will fire automatically after this line completes.
      await createUserProfile(userCredential.user.uid, {
        email,
        name,
        role: "admin",
        phone: `+251${phone}`,
        status: "pending_onboarding",
        pharmacyId: null,
      });

      return userCredential.user;
    } catch (err) {
      isSigningUp.current = false;
      setError(err.message || "Signup failed");
      throw err;
    }
  };

  const finalizeRegistration = async (formData) => {
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

      // Force refresh to ensure custom claims (if any) are updated immediately
      if (auth.currentUser) await auth.currentUser.getIdToken(true);

      return result;
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    }
  };

  /**
   * Cancel an in-progress signup. Calls the backend to delete both the
   * Firebase Auth account and the Firestore profile, so the same email
   * can be used again in a future signup attempt.
   */
  const cancelRegistration = async () => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/auth/cancel-registration`, {
        method: "DELETE",
        headers,
      });
    } catch (err) {
      console.warn("Could not cancel registration on backend:", err.message);
    } finally {
      // Always sign out locally regardless of backend success
      await signOut(auth).catch(() => {});
    }
  };
  
  const login = async (email, password) => {
    setError(null);
    setNeedsVerification(false);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // 🚨 FIX: Do NOT sign out. Just flag them.
      if (!userCredential.user.emailVerified) {
        setNeedsVerification(true);
        // We let the frontend router handle the redirect to the VerifyEmailPage
      }

      return userCredential.user;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    }
  };

  // const login = async (email, password) => {
  //   setError(null);
  //   try {
  //     const userCredential = await signInWithEmailAndPassword(
  //       auth,
  //       email,
  //       password,
  //     );

  //     if (!userCredential.user.emailVerified) {
  //       await signOut(auth); // Ensure we don't stay in a limbo state
  //       throw new Error("Please verify your email before logging in.");
  //     }

  //     // We don't set user here. onAuthStateChanged handles it.
  //     return userCredential.user;
  //   } catch (err) {
  //     setError(err.message || "Login failed");
  //     throw err;
  //   }
  // };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      // State is cleared by onAuthStateChanged listener
    } catch (err) {
      setError(err.message || "Logout failed");
      throw err;
    }
  };

  // ---------------------------------------------------------
  // PROVIDER (Memoized)
  // ---------------------------------------------------------
  const value = useMemo(
    () => ({
      user,
      authUser,
      loading: isInitializing,
      error,
      needsVerification, 
      createAccount,
      finalizeRegistration,
      cancelRegistration,
      login,
      logout,
      refreshPharmacyStatus,
      clearError: () => setError(null),
      isSuperAdmin: user?.role === "superadmin",
      pharmacyStatus,
      subscriptionStatus,
      resendVerificationEmail: async () => {
        if (authUser && !authUser.emailVerified) {
          await sendEmailVerification(authUser);
        }
      },
    }),
    [user, authUser, isInitializing, error, pharmacyStatus, subscriptionStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
