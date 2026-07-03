// backend/src/config/subscriptionConfig.js

export const SUBSCRIPTION_TIERS = {
  STARTER: 'starter',
  GROWTH: 'growth',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise'
};

export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.STARTER]: {
    maxSkus: 500,
    maxUsers: 3,
    maxBranches: 1,
    dailyTransactions: 50,
    features: {
      
      multiBranch: false,
      advancedReports: false,
      coldChain: false,
      
    }
  },
  [SUBSCRIPTION_TIERS.GROWTH]: {
    maxSkus: 2000,
    maxUsers: 5,
    maxBranches: 2,
    dailyTransactions: 200,
    features: {
      
      multiBranch: true,
      advancedReports: true,
      coldChain: false,
     
    }
  },
  [SUBSCRIPTION_TIERS.BUSINESS]: {
    maxSkus: Infinity,
    maxUsers: Infinity,
    maxBranches: Infinity,
    dailyTransactions: Infinity,
    features: {
      
      multiBranch: true,
      advancedReports: true,
      closedChain: true,
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
