import { getFirestore } from "../config/firebase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPublicSubscriptionTiers = asyncHandler(async (req, res) => {
    const db = getFirestore();
    const doc = await db.collection("platformSettings").doc("subscriptionTiers").get();
    
    if (!doc.exists) {
        return res.json({ tiers: {} });
    }
    
    // We can filter out disabled tiers for the public landing page
    const allTiers = doc.data();
    const activeTiers = {};
    
    for (const [key, tier] of Object.entries(allTiers)) {
        if (tier.enabled) {
            activeTiers[key] = tier;
        }
    }
    
    res.json({ tiers: activeTiers });
});
