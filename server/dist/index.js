"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const categories_js_1 = __importDefault(require("./routes/categories.js"));
const products_js_1 = __importDefault(require("./routes/products.js"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const settings_js_1 = __importDefault(require("./routes/settings.js"));
const admin_js_1 = __importDefault(require("./routes/admin.js"));
const coupons_js_1 = __importDefault(require("./routes/coupons.js"));
const checkout_js_1 = __importDefault(require("./routes/checkout.js"));
const payments_js_1 = __importDefault(require("./routes/payments.js"));
const wishlist_js_1 = __importDefault(require("./routes/wishlist.js"));
const reviews_js_1 = __importDefault(require("./routes/reviews.js"));
const orders_js_1 = __importDefault(require("./routes/orders.js"));
const restockRequests_js_1 = __importDefault(require("./routes/restockRequests.js"));
const app = (0, express_1.default)();
app.set("trust proxy", true);
const PORT = process.env.PORT || 5000;
// Ensure uploads/products directory exists for local development storage
const uploadsDir = path_1.default.join(process.cwd(), "uploads", "products");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
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
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
// RAW BODY PARSER FOR RAZORPAY WEBHOOK SIGNATURE VERIFICATION (MUST COME BEFORE express.json())
app.use("/api/payments/razorpay/webhook", express_1.default.raw({ type: "application/json" }));
app.use(express_1.default.json());
// Serve uploads directory statically
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
// Safe diagnostic log (DO NOT print secret value)
console.log("MSG91_AUTH_KEY configured:", Boolean(process.env.MSG91_AUTH_KEY));
// Express REST API Routers
// CRITICAL: Mount specific routers BEFORE wildcard productsRouter (/api/products)
app.use("/api/products/categories", categories_js_1.default);
app.use("/api/categories", categories_js_1.default);
app.use("/api/orders", orders_js_1.default);
app.use("/api/my-orders", orders_js_1.default);
app.use("/api/auth", auth_js_1.default);
app.use("/api/settings", settings_js_1.default);
app.use("/api/admin", admin_js_1.default);
app.use("/api/coupons", coupons_js_1.default);
app.use("/api/checkout", checkout_js_1.default);
app.use("/api/cart", checkout_js_1.default);
app.use("/api/payments", payments_js_1.default);
app.use("/api/wishlist", wishlist_js_1.default);
app.use("/api/reviews", reviews_js_1.default);
app.use("/api/restock-requests", restockRequests_js_1.default);
// Wildcard products router (GET /api/products, GET /api/products/:slug) MUST COME AFTER CATEGORIES
app.use("/api/products", products_js_1.default);
// Health Check Endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", server: "FictionFigure Express Server", port: PORT });
});
// Production Service & Version Verification Endpoint (Phase 2)
app.get("/api/version", (req, res) => {
    const commitSha = process.env.RENDER_GIT_COMMIT ||
        process.env.COMMIT_REF ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.RAILWAY_GIT_COMMIT_SHA ||
        "6dc2262";
    res.json({
        success: true,
        service: "fictionfigure-api",
        commit: commitSha,
        build: new Date().toISOString(),
        routes: {
            categories: true,
            orders: true,
            reviews: true,
            settings: true,
        },
    });
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
app.use((err, req, res, next) => {
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
    console.log(`[API VERSION] 6dc2262`);
    console.log(`[CATEGORY ROUTE REGISTERED] GET /api/products/categories`);
    console.log(`[CATEGORY ROUTE REGISTERED] GET /api/categories`);
    console.log(`[ORDER ROUTE REGISTERED] GET /api/orders/my-orders`);
    console.log(`[REVIEWS ROUTE REGISTERED] GET /api/reviews/admin/all`);
    console.log(`FictionFigure Express API Server running at http://localhost:${PORT}`);
});
