export const SUBSCRIPTION_TIERS = {
  STARTER: "starter",
  GROWTH: "growth",
  BUSINESS: "business",
  ENTERPRISE: "enterprise",
};

export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.STARTER]: {
    maxSkus: 500,
    maxUsers: 3,
    maxBranches: 1,
    dailyTransactions: 50,
    features: {
      purchaseOrders: false,
      multiBranch: false,
      advancedReports: false,
      coldChain: false,
      apiAccess: false,
    },
  },
  [SUBSCRIPTION_TIERS.GROWTH]: {
    maxSkus: 2000,
    maxUsers: 5,
    maxBranches: 2,
    dailyTransactions: 200,
    features: {
      purchaseOrders: true,
      multiBranch: true,
      advancedReports: true,
      coldChain: false,
      apiAccess: false,
    },
  },
  [SUBSCRIPTION_TIERS.BUSINESS]: {
    maxSkus: Infinity, 
    maxUsers: Infinity,
    maxBranches: Infinity,
    dailyTransactions: Infinity,
    features: {
      purchaseOrders: true,
      multiBranch: true,
      advancedReports: true,
      coldChain: true,
      apiAccess: true,
    },
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    maxSkus: Infinity,
    maxUsers: Infinity,
    maxBranches: Infinity,
    dailyTransactions: Infinity,
    features: {
      purchaseOrders: true,
      multiBranch: true,
      advancedReports: true,
      coldChain: true,
      apiAccess: true,
      whiteLabel: true,
    },
  },
};
