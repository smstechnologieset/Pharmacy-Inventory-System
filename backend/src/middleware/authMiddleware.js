export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // STRICT CHECK: Do not fallback to DB
    if (!decodedToken.pharmacyId || !decodedToken.role) {
      // 498 is a custom code often used for "Token Refresh Required"
      return res.status(498).json({
        error: "Token invalid: Missing claims. Please refresh your session.",
        code: "CLAIMS_MISSING",
      });
    }

    req.user = {
      uid: decodedToken.uid,
      role: decodedToken.role,
      pharmacyId: decodedToken.pharmacyId,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// import admin from "firebase-admin";
// import { getFirestore } from "../config/firebase.js";

// export const authenticate = async (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ error: "Unauthorized: No token provided" });
//   }

//   const token = authHeader.split("Bearer ")[1];

//   try {
//     // 1. Verify the Firebase ID token
//     const decodedToken = await admin.auth().verifyIdToken(token);

//     let pharmacyId = decodedToken.pharmacyId;
//     let role = decodedToken.role;

//     // 🚨 FALLBACK FOR STALE TOKENS:
//     // If the token doesn't have the claims (e.g., user just finished Step 1 or token is old),
//     // fetch their role and pharmacyId directly from the Firestore 'users' collection.
//     if (!pharmacyId || !role) {
//       const db = getFirestore();
//       const userDoc = await db.collection("users").doc(decodedToken.uid).get();

//       if (userDoc.exists) {
//         const userData = userDoc.data();
//         pharmacyId = userData.pharmacyId;
//         role = userData.role;

//         // 🛠️ AUTO-REPAIR: Set the custom claims in the background
//         // so the token is fixed for the next request!
//         if (pharmacyId && role) {
//           admin
//             .auth()
//             .setCustomUserClaims(decodedToken.uid, { pharmacyId, role })
//             .catch((err) => {
//               console.error("Failed to auto-sync custom claims:", err);
//             });
//         }
//       }
//     }

//     req.user = {
//       uid: decodedToken.uid,
//       role: role || "pharmacist",
//       pharmacyId: pharmacyId,
//     };

//     // In the exception block, add payment routes:
//     if (!req.user.pharmacyId && req.user.role !== "super_admin") {
//       const allowedPaths = [
//         "/auth/complete-registration",
//         "/payments/initialize",
//         "/payments/verify",
//         "/payments/retry",
//       ];

//       if (allowedPaths.some((path) => req.originalUrl.includes(path))) {
//         return next();
//       }

//       return res
//         .status(403)
//         .json({ error: "User is not assigned to a pharmacy" });
//     }
//     // SECURITY CHECK:
//     // If they still don't have a pharmacyId, they shouldn't be accessing tenant routes.
//     if (!req.user.pharmacyId && req.user.role !== "super_admin") {
//       // 🚨 EXCEPTION: Allow access if they are trying to complete their registration (Step 6)
//       if (req.originalUrl.includes("/auth/complete-registration")) {
//         return next();
//       }

//       return res.status(403).json({
//         error:
//           "User is not assigned to a pharmacy. Please complete registration.",
//       });
//     }

//     next();
//   } catch (error) {
//     console.error("Auth Error:", error);
//     return res
//       .status(403)
//       .json({ error: "Unauthorized: Invalid or expired token" });
//   }
// };
