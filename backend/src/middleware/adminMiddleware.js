import admin from "firebase-admin";

/**
 * SUPER ADMIN GUARD
 * Verifies token AND enforces role === 'superadmin'
 * Super admins do NOT have pharmacyId in their claims.
 */
export const requireSuperAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Super admins are identified by role claim OR by checking the users collection
    let role = decodedToken.role;

    // If role isn't in claims, fetch from Firestore (one-time check)
    if (!role) {
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      if (userDoc.exists) {
        role = userDoc.data().role;
      }
    }

    if (role !== "superadmin") {
      return res.status(403).json({
        error: "Forbidden: Super admin access required",
        code: "INSUFFICIENT_ROLE",
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: "superadmin",
    };
    next();
  } catch (error) {
    console.error("🔥 ADMIN AUTH FAILED:", error.code, error.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
