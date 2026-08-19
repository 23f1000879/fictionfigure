"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const phone_js_1 = require("../utils/phone.js");
const db_js_1 = require("../db.js");
const router = (0, express_1.Router)();
// 1. Check if Mobile Number is already registered
router.post("/check-phone", async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ error: "Mobile number is required" });
        }
        const normalizedPhone = (0, phone_js_1.normalizeIndianPhone)(phone);
        if (!normalizedPhone) {
            return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
        }
        const existingUser = await db_js_1.prisma.user.findFirst({
            where: { phone: normalizedPhone },
        });
        if (existingUser) {
            return res.status(200).json({
                registered: true,
                error: "This mobile number is already registered. Please sign in.",
                normalizedPhone,
            });
        }
        res.json({ registered: false, normalizedPhone });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to check mobile number" });
    }
});
// Helper Handler for Registration & Verification
const handleRegisterCustomer = async (req, res) => {
    try {
        const { firstName, lastName, phone, password, accessToken, widgetToken, reqId } = req.body;
        const msg91Token = accessToken || widgetToken;
        const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
        const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";
        if (!firstName || !lastName || !phone || !password) {
            return res.status(400).json({ error: "First name, last name, mobile number, and password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }
        const normalizedPhone = (0, phone_js_1.normalizeIndianPhone)(phone);
        if (!normalizedPhone) {
            return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
        }
        // Check duplicate phone before MSG91 verification
        const existing = await db_js_1.prisma.user.findFirst({
            where: { phone: normalizedPhone },
        });
        if (existing) {
            return res.status(409).json({
                error: "PHONE_ALREADY_REGISTERED",
                message: "This mobile number is already registered. Please sign in.",
            });
        }
        if (!msg91Token) {
            console.warn("Server-side access-token validation failed: No access token provided.");
            return res.status(400).json({ error: "MSG91 OTP access token is required for registration." });
        }
        if (!MSG91_AUTH_KEY) {
            console.error("Server-side access-token validation failed: MSG91_AUTH_KEY is not configured in server/.env.");
            return res.status(500).json({ error: "Server authentication gateway misconfigured. MSG91_AUTH_KEY missing." });
        }
        // STRICT MSG91 SERVER-SIDE ACCESS TOKEN VALIDATION WITH REQID PAYLOAD
        try {
            const payload = {
                authkey: MSG91_AUTH_KEY,
                "access-token": msg91Token,
            };
            if (reqId) {
                payload.reqId = reqId;
            }
            console.log("Sending MSG91 server-side verification request");
            const msg91Res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authkey: MSG91_AUTH_KEY,
                },
                body: JSON.stringify(payload),
            });
            const msg91Data = await msg91Res.json();
            const isVerified = msg91Res.ok &&
                (msg91Data.type === "success" ||
                    msg91Data.status === "success" ||
                    msg91Data.message === "success" ||
                    msg91Data.message?.toLowerCase().includes("verified") ||
                    (msg91Data.data && !msg91Data.error));
            if (!isVerified) {
                console.warn("Server-side access-token validation failed");
                return res.status(400).json({
                    error: msg91Data.message || "MSG91 access token verification failed. Unauthorized.",
                });
            }
            console.log("Server-side access-token validation succeeded");
        }
        catch (e) {
            console.error("Server-side access-token validation failed due to network error");
            return res.status(500).json({ error: "Unable to verify MSG91 access token with server." });
        }
        // ONLY IF MSG91 VERIFICATION SUCCEEDED:
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        let user;
        try {
            user = await db_js_1.prisma.user.create({
                data: {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    phone: normalizedPhone,
                    passwordHash,
                    phoneVerified: true,
                    isVerified: true,
                    role: "CUSTOMER",
                    email: null,
                },
            });
        }
        catch (dbErr) {
            if (dbErr.code === "P2002") {
                return res.status(409).json({
                    error: "PHONE_ALREADY_REGISTERED",
                    message: "This mobile number is already registered. Please sign in.",
                });
            }
            throw dbErr;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, phone: user.phone, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phoneVerified: user.phoneVerified,
            },
        });
    }
    catch (err) {
        console.error("register-customer error");
        res.status(500).json({ error: err.message || "Registration failed" });
    }
};
// 2. Strict Server-Side Access Token Verification API (register-customer & verify-phone)
router.post("/register-customer", handleRegisterCustomer);
router.post("/verify-phone", handleRegisterCustomer);
// 3. Customer & Admin Login
router.post("/login", async (req, res) => {
    try {
        const { identifier, phone, email, password } = req.body;
        const rawTarget = (identifier || phone || email || "").trim();
        const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";
        if (!rawTarget || !password) {
            return res.status(400).json({ error: "Mobile number (or email) and password are required" });
        }
        let user = null;
        if (rawTarget.includes("@")) {
            user = await db_js_1.prisma.user.findFirst({
                where: { email: rawTarget.toLowerCase() },
            });
        }
        else {
            const normalizedPhone = (0, phone_js_1.normalizeIndianPhone)(rawTarget);
            const searchTarget = normalizedPhone || rawTarget;
            user = await db_js_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { phone: searchTarget },
                        { phone: rawTarget },
                    ],
                },
            });
        }
        if (!user) {
            return res.status(401).json({ error: "Invalid mobile number or password" });
        }
        if (user.isBlocked) {
            return res.status(403).json({ error: "Account suspended by administrator" });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid mobile number or password" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phoneVerified: user.phoneVerified,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || "Login failed" });
    }
});
// 4. Verify Authenticated Session
router.get("/me", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ authenticated: false });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await db_js_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                role: true,
                phoneVerified: true,
                isVerified: true,
                isBlocked: true,
                orders: {
                    orderBy: { createdAt: "desc" },
                    take: 3,
                    select: {
                        id: true,
                        orderNumber: true,
                        totalAmount: true,
                        status: true,
                        createdAt: true,
                        items: {
                            take: 1,
                            select: {
                                title: true,
                                price: true,
                                quantity: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        orders: true,
                        addresses: true,
                    },
                },
            },
        });
        if (!user || user.isBlocked)
            return res.status(401).json({ authenticated: false });
        res.json({ authenticated: true, user });
    }
    catch (err) {
        res.status(401).json({ authenticated: false });
    }
});
exports.default = router;
