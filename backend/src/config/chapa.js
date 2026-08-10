import axios from "axios";

// Chapa API base URL
export const CHAPA_API_URL = "https://api.chapa.co/v1";

// Create axios instance with Chapa authentication
export const chapaClient = axios.create({
  baseURL: CHAPA_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// URLs for callbacks
export const CHAPA_CALLBACK_URL =
  process.env.CHAPA_CALLBACK_URL ||
  "https://pharma-inventory.vercel.app/payment/verify";
export const CHAPA_RETURN_URL =
  process.env.CHAPA_RETURN_URL ||
  "https://pharma-inventory.vercel.app/payment/Verify";
