import { getAuthHeaders } from "./apiHelper.js";

const API_URL = import.meta.env.VITE_API_URL || "https://pharmacy-inventory-system-production-6e12.up.railway.app/api";

const adminFetch = async (path, options = {}) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin${path}`, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));

        // Handle 403 specifically for non-superadmin users
        if (response.status === 403) {
            throw new Error(
                payload.error || "Access denied. Super admin role required."
            );
        }

        throw new Error(payload.error || `Admin API error: ${response.status}`);
    }

    return response.json();
};

// Dashboard
export const fetchAdminDashboardStats = () => adminFetch("/dashboard/stats");

// Pharmacies
export const fetchPharmacies = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return adminFetch(`/pharmacies?${qs}`);
};
export const fetchPharmacyDetail = pharmacyId =>
    adminFetch(`/pharmacies/${pharmacyId}`);
export const updatePharmacyStatus = (pharmacyId, status, reason) =>
    adminFetch(`/pharmacies/${pharmacyId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason })
    });

// Users
export const fetchUsers = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return adminFetch(`/users?${qs}`);
};
export const createUser = (userData) =>
    adminFetch("/users", {
        method: "POST",
        body: JSON.stringify(userData)
    });
export const updateUserRole = (userId, role) =>
    adminFetch(`/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role })
    });
export const updateUserStatus = (userId, status) =>
    adminFetch(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
    });

// Verification
export const fetchVerificationQueue = () => adminFetch("/verification/queue");

// Payments
export const fetchPayments = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return adminFetch(`/payments?${qs}`);
};

// Audit Logs
export const fetchAuditLogs = (limit = 50) =>
    adminFetch(`/audit-logs?limit=${limit}`);

// Settings
export const fetchPlatformSettings = () => adminFetch("/settings");
export const savePlatformSettings = settings =>
    adminFetch("/settings", { method: "PUT", body: JSON.stringify(settings) });

// Feature Flags
export const fetchFeatureFlags = () => adminFetch("/feature-flags");
export const toggleFeatureFlag = (flagId, enabled) =>
    adminFetch(`/feature-flags/${flagId}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ enabled })
    });
export const createFeatureFlag = (flagData) =>
    adminFetch("/feature-flags", {
        method: "POST",
        body: JSON.stringify(flagData)
    });
export const deleteFeatureFlag = (flagId) =>
    adminFetch(`/feature-flags/${flagId}`, {
        method: "DELETE"
    });

// Announcements
export const fetchAnnouncements = () => adminFetch("/announcements");
export const createAnnouncement = data =>
    adminFetch("/announcements", {
        method: "POST",
        body: JSON.stringify(data)
    });
export const updateAnnouncement = (announcementId, data) =>
    adminFetch(`/announcements/${announcementId}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
export const deleteAnnouncement = (announcementId) =>
    adminFetch(`/announcements/${announcementId}`, {
        method: "DELETE"
    });

// Subscription Tiers Management
export const fetchSubscriptionTiers = () => adminFetch("/subscription-tiers");
export const updateSubscriptionTiers = tiers =>
    adminFetch("/subscription-tiers", {
        method: "PUT",
        body: JSON.stringify({ tiers })
    });
export const deleteSubscriptionTier = (tierId) =>
    adminFetch(`/subscription-tiers/${tierId}`, {
        method: "DELETE"
    });

// Subscription Config
export const fetchSubscriptionConfig = () => adminFetch("/subscription-config");
