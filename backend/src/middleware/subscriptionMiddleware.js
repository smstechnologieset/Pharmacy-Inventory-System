import { getFirestore } from "../config/firebase.js";
import { TIER_LIMITS } from "../config/subscriptionConfig.js";

// 1. Loads the pharmacy (tenant) data and checks if subscription is active

// In backend/src/middleware/subscriptionMiddleware.js
// Update the loadTenantContext function:

export const loadTenantContext = async (req, res, next) => {
  // Super admins bypass tenant context
  if (req.user.role === "super_admin") {
    req.tenant = null;
    return next();
  }

  if (!req.user.pharmacyId) {
    return res
      .status(403)
      .json({ error: "User is not assigned to a pharmacy" });
  }

  try {
    const db = getFirestore();
    const pharmacyDoc = await db
      .collection("pharmacies")
      .doc(req.user.pharmacyId)
      .get();

    if (!pharmacyDoc.exists) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    const pharmacyData = pharmacyDoc.data();

    // 🆕 CHECK BOTH STATUSES
    const pharmacyStatus = pharmacyData.status;
    const subscriptionStatus = pharmacyData.subscription?.status;

    // Check if pharmacy is approved by admin
    if (pharmacyStatus !== "active") {
      return res.status(403).json({
        error: "Pharmacy not approved",
        message: "Your pharmacy registration is pending admin approval.",
        pharmacyStatus,
      });
    }

    // Check if subscription is active
    if (subscriptionStatus !== "active" && subscriptionStatus !== "trialing") {
      return res.status(402).json({
        error: "Subscription inactive",
        message: "Please complete your payment to continue using the system.",
        subscriptionStatus,
      });
    }

    // Attach tenant data to request
    req.tenant = { id: pharmacyDoc.id, ...pharmacyData };
    next();
  } catch (error) {
    console.error("Error loading tenant context:", error);
    res.status(500).json({ error: "Failed to load tenant context" });
  }
};

// export const loadTenantContext = async (req, res, next) => {
//   // Super admins bypass tenant context
//   if (req.user.role === "super_admin") {
//     req.tenant = null;
//     return next();
//   }

//   let pharmacyId = req.user.pharmacyId; // Get from token first

//   try {
//     const db = getFirestore();

//     // 🛡️ FALLBACK: If the token is missing the pharmacyId, fetch it from Firestore
//     if (!pharmacyId) {
//       console.warn(
//         `⚠️ User ${req.user.uid} missing pharmacyId in token. Fetching from Firestore...`,
//       );
//       const userDoc = await db.collection("users").doc(req.user.uid).get();

//       if (userDoc.exists) {
//         pharmacyId = userDoc.data().pharmacyId;

//         // Optional: Update the custom claims in the background for next time
//         // await admin.auth().setCustomUserClaims(req.user.uid, {
//         //   pharmacyId: pharmacyId,
//         //   role: req.user.role
//         // });
//       }
//     }

//     // If we STILL don't have a pharmacyId, THEN throw the 403 error
//     if (!pharmacyId) {
//       return res
//         .status(403)
//         .json({ error: "User is not assigned to a pharmacy" });
//     }

//     // Update req.user just in case downstream controllers need it
//     req.user.pharmacyId = pharmacyId;

//     const pharmacyDoc = await db.collection("pharmacies").doc(pharmacyId).get();

//     if (!pharmacyDoc.exists) {
//       return res.status(404).json({ error: "Pharmacy not found" });
//     }

//     const pharmacyData = pharmacyDoc.data();

//     // Check if subscription is active (ignore for trialing)
//     if (
//       pharmacyData.subscription?.status !== "active" &&
//       pharmacyData.subscription?.status !== "trialing"
//     ) {
//       return res.status(402).json({
//         error: "Subscription inactive",
//         message: "Please renew your subscription to continue using the system.",
//       });
//     }

//     // Attach tenant data to request
//     req.tenant = { id: pharmacyDoc.id, ...pharmacyData };
//     next();
//   } catch (error) {
//     console.error("Error loading tenant context:", error);
//     res.status(500).json({ error: "Failed to load tenant context" });
//   }
// };

// 2. Blocks access if the tenant's tier doesn't include a specific feature
export const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (req.user.role === "super_admin") return next();

    const tier = req.tenant.subscription.tier;
    const limits = TIER_LIMITS[tier];

    if (!limits || !limits.features[featureName]) {
      return res.status(403).json({
        error: "Feature locked",
        message: `The '${featureName}' feature is not included in your current plan. Please upgrade.`,
      });
    }
    next();
  };
};

// 3. Blocks creation if a quota (like SKUs or Users) is maxed out
export const checkQuota = (quotaType) => {
  return async (req, res, next) => {
    if (req.user.role === "super_admin") return next();

    const tier = req.tenant.subscription.tier;
    const limits = TIER_LIMITS[tier];
    const usage = req.tenant.usageMetrics || {};

    let current = 0;
    let max = 0;
    let unitName = "";

    if (quotaType === "sku") {
      current = usage.currentSkuCount || 0;
      max = limits.maxSkus;
      unitName = "medicines/SKUs";
    } else if (quotaType === "user") {
      current = usage.currentUserCount || 0;
      max = limits.maxUsers;
      unitName = "staff/users";
    } else if (quotaType === "branch") {
      current = usage.currentBranchCount || 0;
      max = limits.maxBranches;
      unitName = "branches";
    }

    if (current >= max) {
      return res.status(402).json({
        error: "Quota exceeded",
        message: `You have reached the limit of ${max} ${unitName}. Please upgrade your plan to add more.`,
      });
    }
    next();
  };
};
