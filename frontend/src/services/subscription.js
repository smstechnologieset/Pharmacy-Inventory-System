const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const fetchSubscriptionTiers = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/subscription-tiers`);
    if (!response.ok) throw new Error("Failed to fetch subscription tiers");
    const data = await response.json();
    return data.tiers;
  } catch (error) {
    console.error("Error fetching subscription tiers:", error);
    // Fallback to hardcoded tiers if API fails
    return {
      starter: {
        name: "Starter",
        description: "Perfect for single-branch community pharmacies",
        limits: { maxSkus: 500, maxUsers: 3, maxBranches: 1, dailyTransactions: 50 },
        pricing: { monthly: 1500, yearly: 15000 },
        features: ["Basic Inventory", "Sales Tracking", "Low Stock Alerts", "Email Support"],
        enabled: true,
      },
      growth: {
        name: "Growth",
        description: "For growing pharmacies with multiple staff",
        limits: { maxSkus: 2000, maxUsers: 5, maxBranches: 2, dailyTransactions: 200 },
        pricing: { monthly: 3000, yearly: 28000 },
        features: ["Everything in Starter", "Multi-branch", "Advanced Reports", "Priority Support", "API Access"],
        enabled: true,
      },
      business: {
        name: "Business",
        description: "For chains and wholesalers who need unlimited scale",
        limits: { maxSkus: -1, maxUsers: -1, maxBranches: -1, dailyTransactions: -1 },
        pricing: { monthly: 5000, yearly: 42000 },
        features: ["Everything in Growth", "AI Forecasting", "Custom Integrations", "Dedicated Account Manager", "SLA Guarantee"],
        enabled: true,
      },
    };
  }
};
