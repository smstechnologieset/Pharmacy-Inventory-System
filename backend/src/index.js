import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeFirebase } from "./config/firebase.js";
import { initializeWebPush } from "./config/webPush.js";
import notificationRoutes from "./routes/notifications.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
initializeFirebase();

// Initialize Web Push (VAPID keys)
initializeWebPush();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Pharmacy Inventory Backend is running" });
});

// Routes
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
