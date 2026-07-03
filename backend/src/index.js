import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeFirebase } from "./config/firebase.js";
import { initializeWebPush } from "./config/webPush.js";
import notificationRoutes from "./routes/notifications.js";
import dashboardRoutes from "./routes/dashboard.js";
import staffRoutes from "./routes/staff.js";
import medicinesRoutes from "./routes/medicines.js";
import suppliersRoutes from "./routes/suppliers.js";
import salesRoutes from "./routes/sales.js";
import pharmaciesRoutes from "./routes/pharmacies.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";
// ... other imports ..
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
    origin: [
      process.env.NODE_ENV == "development" && "http://localhost:5173",
      "https://pharma-inventory.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

// ...
app.use("/api/auth", authRoutes);
// Routes
app.use("/api/notifications", notificationRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/medicines", medicinesRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/pharmacies", pharmaciesRoutes);

app.use("/api/payments", paymentRoutes);
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
