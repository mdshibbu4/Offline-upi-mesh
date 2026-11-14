import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bridgeRoutes from "./routes/bridgeRoutes.js";
import meshRoutes from "./routes/meshRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
app.set("trust proxy", 1); // needed behind Render/Heroku so rate limiting sees real IPs

app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",") }));
app.use(express.json({ limit: "100kb" }));

const limiter = (max, windowMs) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { message: "Too many requests, slow down" } });
app.use("/api", limiter(300, 60 * 1000));
app.use("/api/auth/login", limiter(10, 15 * 60 * 1000)); // brute-force protection
app.use("/api/auth/register", limiter(10, 60 * 60 * 1000));
app.use("/api/payment/send", limiter(30, 60 * 1000));

app.get("/api/health", (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({ status: "ok", database: dbStates[mongoose.connection.readyState], time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bridge", bridgeRoutes);
app.use("/api/mesh", meshRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : "Server error" });
});

export default app;
