import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import categoriesRouter from "./routes/categories.js";
import productsRouter from "./routes/products.js";
import authRouter from "./routes/auth.js";
import settingsRouter from "./routes/settings.js";
import adminRouter from "./routes/admin.js";
import couponsRouter from "./routes/coupons.js";
import checkoutRouter from "./routes/checkout.js";
import paymentsRouter from "./routes/payments.js";
import wishlistRouter from "./routes/wishlist.js";
import reviewsRouter from "./routes/reviews.js";
import ordersRouter from "./routes/orders.js";

const app = express();
app.set("trust proxy", true);
const PORT = process.env.PORT || 5000;

// Ensure uploads/products directory exists for local development storage
const uploadsDir = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://www.fictionfigures.in",
  "https://fictionfigures.in",
  "https://fictionfigure.vercel.app",
  ...(process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
    : []),
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// RAW BODY PARSER FOR RAZORPAY WEBHOOK SIGNATURE VERIFICATION (MUST COME BEFORE express.json())
app.use("/api/payments/razorpay/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// Serve uploads directory statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Safe diagnostic log (DO NOT print secret value)
console.log("MSG91_AUTH_KEY configured:", Boolean(process.env.MSG91_AUTH_KEY));

// Express REST API Routers
// CRITICAL: Mount specific subpaths (/api/products/categories, /api/categories) BEFORE wildcard router (/api/products)
app.use("/api/products/categories", categoriesRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/my-orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/reviews", reviewsRouter);

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", server: "FictionFigure Express Server", port: PORT });
});

// Catch-All Middleware for unmatched /api/* routes (Guarantees JSON response instead of Express HTML 404)
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API route not found",
    path: req.originalUrl,
  });
});

// Centralized API Error Handler Middleware (Guarantees JSON error response for unhandled exceptions)
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global API Error Handler caught:", err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "An unexpected internal server error occurred.",
  });
});

app.listen(PORT, () => {
  console.log(`FictionFigure Express API Server running at http://localhost:${PORT}`);
});
