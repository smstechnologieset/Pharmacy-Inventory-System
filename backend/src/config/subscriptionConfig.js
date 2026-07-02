// backend/src/config/subscriptionConfig.js

export const SUBSCRIPTION_TIERS = {
  STARTER: 'starter_fikir',
  GROWTH: 'growth_gizmo',
  BUSINESS: 'business_medipro',
  ENTERPRISE: 'enterprise_govtech'
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
      apiAccess: false
    }
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
      apiAccess: false
    }
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
      apiAccess: true
    }
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
      whiteLabel: true
    }
  }
};

// 🚨 PRICING CONFIGURATION FOR CHAPA
export const TIER_PRICING = {
  [SUBSCRIPTION_TIERS.STARTER]: {
    monthly: { amount: 1500, currency: 'ETB' },
    yearly: { amount: 15000, currency: 'ETB' }
  },
  [SUBSCRIPTION_TIERS.GROWTH]: {
    monthly: { amount: 3000, currency: 'ETB' },
    yearly: { amount: 28000, currency: 'ETB' }
  },
  [SUBSCRIPTION_TIERS.BUSINESS]: {
    monthly: { amount: 5000, currency: 'ETB' },
    yearly: { amount: 42000, currency: 'ETB' }
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    monthly: { amount: 7000, currency: 'ETB' },
    yearly: { amount: 70000, currency: 'ETB' }
  }
};
