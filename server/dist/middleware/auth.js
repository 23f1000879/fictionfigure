"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("../db.js");
const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";
/**
 * Require valid JWT authentication for any logged-in user.
 * Rejects blocked users automatically.
 */
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, error: "Authentication required. Bearer token missing." });
        }
        const token = authHeader.substring(7);
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (e) {
            return res.status(401).json({ success: false, error: "Invalid or expired session token." });
        }
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ success: false, error: "Malformed session token." });
        }
        const user = await db_js_1.prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            return res.status(401).json({ success: false, error: "User account not found." });
        }
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact support.",
                error: "ACCOUNT_BLOCKED",
            });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(500).json({ success: false, error: "Authentication middleware error." });
    }
};
exports.requireAuth = requireAuth;
/**
 * Require ADMIN role for administrative APIs.
 * Verifies JWT token, database user record, admin role, and block status.
 */
const requireAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log(`[AdminAuth] Rejected ${req.method} ${req.originalUrl}: Bearer token missing.`);
            return res.status(401).json({ success: false, error: "Admin authentication required. Bearer token missing." });
        }
        const token = authHeader.substring(7);
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (e) {
            return res.status(401).json({ success: false, error: "Invalid or expired admin session token." });
        }
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ success: false, error: "Malformed session token." });
        }
        const user = await db_js_1.prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            return res.status(401).json({ success: false, error: "Admin user account not found." });
        }
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your admin account has been blocked.",
                error: "ADMIN_BLOCKED",
            });
        }
        if (user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                error: "Forbidden: Admin privileges required.",
            });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(500).json({ success: false, error: "Admin authorization middleware error." });
    }
};
exports.requireAdmin = requireAdmin;
