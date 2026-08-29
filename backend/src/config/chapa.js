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

// Helper to get sanitized valid public return URL (Chapa validator requires clean public URL without query parameters)
export const getChapaReturnUrl = () => {
  let envUrl = process.env.CHAPA_RETURN_URL
    ? process.env.CHAPA_RETURN_URL.replace(/^["']|["']$/g, "").trim()
    : "";

  if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
    return "https://pharmacy-inventory-system-smoky.vercel.app/payment/verify";
  }

  if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) {
    envUrl = `https://${envUrl}`;
  }

  return envUrl.split("?")[0].replace(/\/+$/, "");
};

export const getChapaCallbackUrl = () => {
  let envUrl = process.env.CHAPA_CALLBACK_URL
    ? process.env.CHAPA_CALLBACK_URL.replace(/^["']|["']$/g, "").trim()
    : "";

  if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
    return "https://pharmacy-inventory-system-production-6e12.up.railway.app/api/payments/webhook";
  }

  if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) {
    envUrl = `https://${envUrl}`;
  }

  return envUrl.split("?")[0].replace(/\/+$/, "");
};
