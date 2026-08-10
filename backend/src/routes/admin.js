import express from "express";
import { requireSuperAdmin } from "../middleware/adminMiddleware.js";
import {
    getAdminDashboardStats,
    listPharmacies,
    getPharmacyDetail,
    updatePharmacyStatus,
    listUsers,
    createUser,
    updateUserRole,
    updateUserStatus,
    getVerificationQueue,
    getAuditLogs,
    getPaymentsOverview,
    getPlatformSettings,
    updatePlatformSettings,
    getFeatureFlags,
    toggleFeatureFlag,
    createFeatureFlag,
    deleteFeatureFlag,
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getSubscriptionConfig,
    updateSubscriptionTiers,
    getSubscriptionTiers,
    deleteSubscriptionTier
} from "../controllers/adminController.js";

const router = express.Router();

// ALL admin routes require super admin role
router.use(requireSuperAdmin);

// Dashboard
router.get("/dashboard/stats", getAdminDashboardStats);

// Pharmacies
router.get("/pharmacies", listPharmacies);
router.get("/pharmacies/:pharmacyId", getPharmacyDetail);
router.patch("/pharmacies/:pharmacyId/status", updatePharmacyStatus);

// Users
router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/status", updateUserStatus);

// Verification
router.get("/verification/queue", getVerificationQueue);

// Payments
router.get("/payments", getPaymentsOverview);

// Audit
router.get("/audit-logs", getAuditLogs);

// Settings
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);

// Feature Flags
router.get("/feature-flags", getFeatureFlags);
router.post("/feature-flags", createFeatureFlag);
router.patch("/feature-flags/:flagId/toggle", toggleFeatureFlag);
router.delete("/feature-flags/:flagId", deleteFeatureFlag);

// Announcements
router.get("/announcements", getAnnouncements);
router.post("/announcements", createAnnouncement);
router.put("/announcements/:announcementId", updateAnnouncement);
router.delete("/announcements/:announcementId", deleteAnnouncement);

// Subscription Tiers Management
router.get("/subscription-tiers", getSubscriptionTiers);
router.put("/subscription-tiers", updateSubscriptionTiers);
router.delete("/subscription-tiers/:tierId", deleteSubscriptionTier);

// Subscription Config
router.get("/subscription-config", getSubscriptionConfig);

export default router;
