import { getAuthHeaders } from "./apiHelper";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

// Announcements
export const fetchAnnouncements = () => adminFetch("/announcements");
export const createAnnouncement = data =>
    adminFetch("/announcements", {
        method: "POST",
        body: JSON.stringify(data)
    });

// Subscription Config
export const fetchSubscriptionConfig = () => adminFetch("/subscription-config");
