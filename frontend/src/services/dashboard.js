import { getAuthHeaders } from "./apiHelper.js";

const API_URL = import.meta.env.VITE_API_URL || "https://pharmacy-inventory-system-production-6e12.up.railway.app/api";

export const fetchDashboardStats = async (pharmacyId, options = {}) => {
  if (!pharmacyId) throw new Error("pharmacyId is required");

  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}/dashboard/stats/${pharmacyId}`);
  if (options.lowStockThreshold !== undefined) {
    url.searchParams.set(
      "lowStockThreshold",
      String(options.lowStockThreshold),
    );
  }
  if (options.recentSalesLimit !== undefined) {
    url.searchParams.set("recentSalesLimit", String(options.recentSalesLimit));
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to fetch dashboard stats");
  }

  return response.json();
};
