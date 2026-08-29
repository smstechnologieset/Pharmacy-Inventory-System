import axios from "axios";

// Chapa API base URL
export const CHAPA_API_URL = "https://api.chapa.co/v1";

// Create axios instance with Chapa authentication
export const chapaClient = axios.create({
  baseURL: CHAPA_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to get sanitized valid public return URL (Chapa validator strictly requires valid public domain)
export const getChapaReturnUrl = (txRef) => {
  const envUrl = process.env.CHAPA_RETURN_URL
    ? process.env.CHAPA_RETURN_URL.replace(/^["']|["']$/g, "").trim()
    : "";
  const baseUrl =
    envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")
      ? envUrl
      : "https://pharmacy-inventory-system-smoky.vercel.app/payment/verify";

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const separator = cleanBase.includes("?") ? "&" : "?";
  return `${cleanBase}${separator}tx_ref=${encodeURIComponent(txRef)}`;
};

export const getChapaCallbackUrl = () => {
  const envUrl = process.env.CHAPA_CALLBACK_URL
    ? process.env.CHAPA_CALLBACK_URL.replace(/^["']|["']$/g, "").trim()
    : "";
  return envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")
    ? envUrl
    : "https://pharmacy-inventory-system-production-6e12.up.railway.app/api/payments/webhook";
};
