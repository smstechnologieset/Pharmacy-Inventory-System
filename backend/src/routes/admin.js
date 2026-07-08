import express from "express";
import { requireSuperAdmin } from "../middleware/adminMiddleware.js";
import {
  getAdminDashboardStats,
  listPharmacies,
  getPharmacyDetail,
  updatePharmacyStatus,
  listUsers,
  getVerificationQueue,
  getAuditLogs,
  getPaymentsOverview,
  getPlatformSettings,
  updatePlatformSettings,
  getFeatureFlags,
  toggleFeatureFlag,
  getAnnouncements,
  createAnnouncement,
  getSubscriptionConfig,
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
router.patch("/feature-flags/:flagId/toggle", toggleFeatureFlag);

// Announcements
router.get("/announcements", getAnnouncements);
router.post("/announcements", createAnnouncement);

// Subscription Config
router.get("/subscription-config", getSubscriptionConfig);

export default router;
