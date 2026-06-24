import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeFirebase } from "./config/firebase.js";
import { initializeWebPush } from "./config/webPush.js";
import notificationRoutes from "./routes/notifications.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

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
    origin: process.env.FRONTEND_URL || "http://local host:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Ensure all responses are JSON (prevent Express from sending HTML errors)
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Pharmacy Inventory Backend is running" });
});

// Routes
app.use("/api/notifications", notificationRoutes);

// 404 Not Found Handler (must be before error handler)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
