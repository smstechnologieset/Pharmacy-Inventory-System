import { getFirestore } from "../config/firebase.js";

let cachedTiers = null;
let lastFetch = 0;
const CACHE_TTL = 1 * 60 * 1000; // 1 minute (reduced for quicker updates)

export const getTierLimits = async (tierId) => {
  try {
    const now = Date.now();
    if (!cachedTiers || now - lastFetch > CACHE_TTL) {
      const db = getFirestore();
      const settingsDoc = await db.collection("platformSettings").doc("subscriptionTiers").get();
      
      if (settingsDoc.exists) {
        cachedTiers = settingsDoc.data() || {};
        lastFetch = now;
      } else {
        // Fallback to empty if not found
        cachedTiers = {};
      }
    }

    const tierData = cachedTiers[tierId];
    if (tierData && tierData.limits) {
      return tierData.limits;
    }

    // Default fallback limits if tier not found or has no limits
    return {
      maxUsers: 1,
      maxSkus: 100,
      dailyTransactions: 50,
      maxBranches: 1,
    };
  } catch (error) {
    console.error("Error fetching tier limits:", error);
    return {
      maxUsers: 1,
      maxSkus: 100,
      dailyTransactions: 50,
      maxBranches: 1,
    };
  }
};

export const getTierFeatures = async (tierId) => {
  try {
    const now = Date.now();
    if (!cachedTiers || now - lastFetch > CACHE_TTL) {
      const db = getFirestore();
      const settingsDoc = await db.collection("platformSettings").doc("subscriptionTiers").get();
      if (settingsDoc.exists) {
        cachedTiers = settingsDoc.data() || {};
        lastFetch = now;
      }
    }
    
    const tierData = cachedTiers[tierId];
    if (tierData && tierData.features) {
      return tierData.features;
    }
    
    return {};
  } catch (error) {
    console.error("Error fetching tier features:", error);
    return {};
  }
};
