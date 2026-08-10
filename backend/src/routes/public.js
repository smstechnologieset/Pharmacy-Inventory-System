import express from "express";
import { getPublicSubscriptionTiers } from "../controllers/publicController.js";

const router = express.Router();

router.get("/subscription-tiers", getPublicSubscriptionTiers);

export default router;
