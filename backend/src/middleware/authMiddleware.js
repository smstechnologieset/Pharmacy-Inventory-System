import admin from "firebase-admin";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user data to the request object
    // Note: This assumes you have set 'pharmacyId' and 'role' in Firebase Custom Claims
    req.user = {
      uid: decodedToken.uid,
      role: decodedToken.role || 'pharmacist', 
      pharmacyId: decodedToken.pharmacyId 
    };
    
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
