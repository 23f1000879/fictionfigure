"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAuthoritativeTotals = calculateAuthoritativeTotals;
exports.handleValidateCart = handleValidateCart;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const phone_js_1 = require("../utils/phone.js");
const db_js_1 = require("../db.js");
const settings_js_1 = require("./settings.js");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";
// Authoritative Server-Side Total Calculation
async function calculateAuthoritativeTotals(cartItems, couponCode, userId, isCOD = false) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error("Your cart is empty.");
    }
    const variantIds = cartItems.map((item) => item.variantId);
    const dbVariants = await db_js_1.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
            product: {
                include: {
                    images: { orderBy: { sortOrder: "asc" }, take: 1 },
                },
            },
            inventory: true,
        },
    });
    const dbVariantMap = new Map(dbVariants.map((v) => [v.id, v]));
    let subtotal = 0;
    const verifiedItems = [];
    for (const item of cartItems) {
        const dbVariant = dbVariantMap.get(item.variantId);
        if (!dbVariant || dbVariant.product.status !== "ACTIVE") {
            throw new Error(`Product variant is no longer available.`);
        }
        const availableStock = dbVariant.inventory ? dbVariant.inventory.quantity : dbVariant.inventoryCount;
        if (availableStock < item.quantity) {
            throw new Error(`Insufficient stock for "${dbVariant.product.name}". Only ${availableStock} available.`);
        }
        const itemTotal = dbVariant.price * item.quantity;
        subtotal += itemTotal;
        verifiedItems.push({
            productId: dbVariant.productId,
            variantId: dbVariant.id,
            title: `${dbVariant.product.name} - ${dbVariant.title}`,
            sku: dbVariant.sku,
            price: dbVariant.price,
            quantity: item.quantity,
            total: itemTotal,
            image: dbVariant.imageUrl || dbVariant.product.images[0]?.url || "",
        });
    }
    subtotal = Math.round(subtotal);
    // Validate Coupon Server-Side
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode && couponCode.trim()) {
        const cleanCode = couponCode.toUpperCase().trim();
        const coupon = await db_js_1.prisma.coupon.findUnique({ where: { code: cleanCode } });
        if (coupon && coupon.isActive) {
            const now = new Date();
            const isStarted = !coupon.startDate || new Date(coupon.startDate) <= now;
            const notExpired = !coupon.endDate || new Date(coupon.endDate) >= now;
            const underMaxUsage = coupon.usedCount < coupon.maxUsage;
            const meetsMinOrder = subtotal >= coupon.minOrderValue;
            let userEligible = true;
            if (userId && coupon.perCustomerLimit) {
                const usageCount = await db_js_1.prisma.order.count({
                    where: { userId, couponId: coupon.id, status: { not: "CANCELLED" } },
                });
                if (usageCount >= coupon.perCustomerLimit)
                    userEligible = false;
            }
            if (isStarted && notExpired && underMaxUsage && meetsMinOrder && userEligible) {
                if (coupon.discountType === "PERCENTAGE") {
                    discountAmount = (subtotal * coupon.discountValue) / 100;
                    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                        discountAmount = coupon.maxDiscountAmount;
                    }
                }
                else {
                    discountAmount = Math.min(coupon.discountValue, subtotal);
                }
                discountAmount = Math.round(discountAmount);
                appliedCoupon = coupon;
            }
        }
    }
    // Admin-Controlled Dynamic Store Settings for Shipping & Zero COD Handling Fee
    const { shippingFee: configShippingFee, freeShippingThreshold: configThreshold } = await (0, settings_js_1.getStoreSettingsHelper)();
    const shippingAmount = subtotal >= configThreshold || subtotal === 0 ? 0 : configShippingFee;
    const codFee = 0; // COD Handling fee REMOVED completely per user requirements
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const totalAmount = Math.max(0, afterDiscount + shippingAmount);
    return {
        subtotal,
        discountAmount,
        shippingAmount,
        codFee: 0,
        totalAmount,
        verifiedItems,
        appliedCoupon,
        shippingFeeSetting: configShippingFee,
        freeShippingThresholdSetting: configThreshold,
    };
}
// 1. Identify Customer & Initiate OTP Endpoint
router.post("/auth/identify", async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ error: "Mobile number is required." });
        }
        const normalizedPhone = (0, phone_js_1.normalizeIndianPhone)(phone);
        if (!normalizedPhone) {
            return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
        }
        const existingUser = await db_js_1.prisma.user.findFirst({
            where: { phone: normalizedPhone },
        });
        if (existingUser && existingUser.isBlocked) {
            return res.status(403).json({
                success: false,
                error: "ACCOUNT_BLOCKED",
                message: "Your account has been blocked. Please contact support.",
            });
        }
        // CASE A: Existing Verified Customer -> Skip OTP & Restore Session
        if (existingUser && existingUser.phoneVerified) {
            const token = jsonwebtoken_1.default.sign({ userId: existingUser.id, phone: existingUser.phone, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "7d" });
            return res.json({
                exists: true,
                phoneVerified: true,
                requiresOtp: false,
                token,
                user: {
                    id: existingUser.id,
                    phone: existingUser.phone,
                    firstName: existingUser.firstName,
                    lastName: existingUser.lastName,
                    email: existingUser.email,
                },
            });
        }
        // CASE B: New Customer or Unverified Customer -> Require MSG91 OTP Widget Verification
        res.json({
            exists: Boolean(existingUser),
            phoneVerified: false,
            requiresOtp: true,
            normalizedPhone,
        });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to identify customer mobile number." });
    }
});
// 2. Verify MSG91 Widget Access Token Endpoint (Reuses Registration MSG91 Gateway)
router.post(["/auth/verify-widget-token", "/auth/verify-otp"], async (req, res) => {
    try {
        const { phone, accessToken, widgetToken, reqId, firstName, lastName, email } = req.body;
        if (!phone) {
            return res.status(400).json({ error: "Mobile number is required." });
        }
        const normalizedPhone = (0, phone_js_1.normalizeIndianPhone)(phone);
        if (!normalizedPhone) {
            return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
        }
        const msg91Token = accessToken || widgetToken;
        const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
        if (!msg91Token) {
            return res.status(400).json({ error: "MSG91 OTP access token is required for verification." });
        }
        let isVerified = false;
        // STRICT SERVER-SIDE MSG91 ACCESS TOKEN VALIDATION (Same as Registration)
        if (MSG91_AUTH_KEY) {
            try {
                const payload = {
                    authkey: MSG91_AUTH_KEY,
                    "access-token": msg91Token,
                };
                if (reqId)
                    payload.reqId = reqId;
                const msg91Res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        authkey: MSG91_AUTH_KEY,
                    },
                    body: JSON.stringify(payload),
                });
                const msg91Data = await msg91Res.json();
                console.log("Checkout MSG91 verifyAccessToken response:", msg91Data);
                isVerified =
                    msg91Res.ok &&
                        (msg91Data.type === "success" ||
                            msg91Data.status === "success" ||
                            msg91Data.message === "success" ||
                            msg91Data.message?.toLowerCase().includes("verified") ||
                            (msg91Data.data && !msg91Data.error));
                if (!isVerified) {
                    return res.status(400).json({
                        error: msg91Data.message || "MSG91 access token verification failed. Unauthorized.",
                    });
                }
            }
            catch (e) {
                console.error("MSG91 verifyAccessToken network error:", e);
                return res.status(500).json({ error: "Unable to verify MSG91 access token with server." });
            }
        }
        else {
            // Development mode fallback when MSG91_AUTH_KEY is not configured
            isVerified = true;
        }
        // Upsert Verified CUSTOMER User Record in Neon PostgreSQL
        let user = await db_js_1.prisma.user.findFirst({
            where: { phone: normalizedPhone },
        });
        if (user) {
            user = await db_js_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    phoneVerified: true,
                    isVerified: true,
                    firstName: firstName ? firstName.trim() : user.firstName,
                    lastName: lastName ? lastName.trim() : user.lastName,
                    email: email ? email.trim().toLowerCase() : user.email,
                },
            });
        }
        else {
            user = await db_js_1.prisma.user.create({
                data: {
                    phone: normalizedPhone,
                    firstName: firstName ? firstName.trim() : "Collector",
                    lastName: lastName ? lastName.trim() : "Customer",
                    email: email ? email.trim().toLowerCase() : null,
                    passwordHash: "$2a$10$dummyHashForMobileOnlyUserPasswordPlaceholder",
                    phoneVerified: true,
                    isVerified: true,
                    role: "CUSTOMER",
                },
            });
        }
        // Sign JWT Session Token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, phone: user.phone, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            success: true,
            message: "Mobile number verified successfully.",
            token,
            user: {
                id: user.id,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneVerified: user.phoneVerified,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || "Failed to verify MSG91 access token." });
    }
});
// 2. Fetch User Saved Addresses
router.get("/addresses", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const addresses = await db_js_1.prisma.address.findMany({
            where: { userId: decoded.userId },
            orderBy: { isDefault: "desc" },
        });
        res.json({ addresses });
    }
    catch (err) {
        res.status(401).json({ error: "Unauthorized" });
    }
});
// 3. Authoritative Order Calculation Endpoint
router.post("/calculate", async (req, res) => {
    try {
        const { cartItems, couponCode, paymentMethod } = req.body;
        const isCOD = paymentMethod === "COD";
        const totals = await calculateAuthoritativeTotals(cartItems, couponCode, undefined, isCOD);
        res.json({ success: true, totals });
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to calculate totals." });
    }
});
// 4. Submit Manual UPI QR Order
router.post("/submit-upi-payment", async (req, res) => {
    try {
        const { cartItems, couponCode, shippingAddress, utr } = req.body;
        const authHeader = req.headers.authorization;
        // 1. Enforce Authentication & Verified Customer Session
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentication required. Please verify your mobile number first." });
        }
        let userId = null;
        let verifiedUser = null;
        try {
            const decoded = jsonwebtoken_1.default.verify(authHeader.split(" ")[1], JWT_SECRET);
            if (decoded.userId) {
                userId = decoded.userId;
                verifiedUser = await db_js_1.prisma.user.findUnique({ where: { id: decoded.userId } });
            }
        }
        catch (e) {
            return res.status(401).json({ error: "Session expired or invalid session token. Please re-verify your mobile number." });
        }
        if (!verifiedUser || !verifiedUser.phoneVerified) {
            return res.status(403).json({ error: "Mobile phone verification is required before placing an order." });
        }
        if (verifiedUser.isBlocked) {
            return res.status(403).json({ error: "Your account has been blocked. Please contact support." });
        }
        // 2. Validate Address Fields & PIN Code Format
        if (!shippingAddress ||
            !shippingAddress.fullName ||
            !shippingAddress.streetAddress ||
            !shippingAddress.city ||
            !shippingAddress.state ||
            !shippingAddress.postalCode) {
            return res.status(400).json({ error: "Complete shipping address (Full Name, Street, City, State, PIN Code) is required." });
        }
        const cleanPin = String(shippingAddress.postalCode).trim();
        if (!/^\d{6}$/.test(cleanPin)) {
            return res.status(400).json({ error: "Please enter a valid 6-digit Indian PIN code." });
        }
        // 3. Authoritative Server-Side Calculation & Inventory Check (isCOD = false)
        let totals;
        try {
            totals = await calculateAuthoritativeTotals(cartItems, couponCode, userId || undefined, false);
        }
        catch (calcErr) {
            if (calcErr.message && calcErr.message.includes("Insufficient stock")) {
                return res.status(409).json({ error: calcErr.message });
            }
            return res.status(400).json({ error: calcErr.message || "Invalid cart items or quantities." });
        }
        const orderNumber = `FF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const orderData = {
            orderNumber,
            userId,
            status: "PENDING",
            subtotal: totals.subtotal,
            discountAmount: totals.discountAmount,
            shippingAmount: totals.shippingAmount,
            totalAmount: totals.totalAmount,
            shippingAddressJson: JSON.stringify({
                ...shippingAddress,
                postalCode: cleanPin,
                phone: verifiedUser.phone || shippingAddress.phone,
            }),
            shippingMethod: "Standard Delivery",
            couponId: totals.appliedCoupon ? totals.appliedCoupon.id : null,
            items: {
                create: totals.verifiedItems.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    title: item.title,
                    sku: item.sku,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.total,
                })),
            },
            payments: {
                create: {
                    paymentMethod: "UPI",
                    status: "PENDING",
                    amount: totals.totalAmount,
                    transactionRef: utr ? String(utr).trim() : null,
                },
            },
        };
        const order = await db_js_1.prisma.$transaction(async (tx) => {
            // 1. Save/Update Customer Name & Email on Verified User
            const nameParts = String(shippingAddress.fullName || "").trim().split(" ");
            const firstName = nameParts[0] || "Collector";
            const lastName = nameParts.slice(1).join(" ") || "Customer";
            await tx.user.update({
                where: { id: verifiedUser.id },
                data: {
                    firstName,
                    lastName,
                    email: shippingAddress.email ? shippingAddress.email.trim().toLowerCase() : verifiedUser.email,
                },
            });
            // 2. Save/UPSERT Delivery Address against Verified Customer Identity
            const existingAddress = await tx.address.findFirst({
                where: {
                    userId: verifiedUser.id,
                    streetAddress: shippingAddress.streetAddress.trim(),
                    postalCode: cleanPin,
                },
            });
            if (existingAddress) {
                await tx.address.update({
                    where: { id: existingAddress.id },
                    data: {
                        fullName: shippingAddress.fullName.trim(),
                        streetAddress: shippingAddress.streetAddress.trim(),
                        apartment: shippingAddress.apartment ? shippingAddress.apartment.trim() : null,
                        city: shippingAddress.city.trim(),
                        state: shippingAddress.state.trim(),
                        postalCode: cleanPin,
                        country: shippingAddress.country || "India",
                        phone: verifiedUser.phone || shippingAddress.phone,
                    },
                });
            }
            else {
                await tx.address.create({
                    data: {
                        userId: verifiedUser.id,
                        fullName: shippingAddress.fullName.trim(),
                        streetAddress: shippingAddress.streetAddress.trim(),
                        apartment: shippingAddress.apartment ? shippingAddress.apartment.trim() : null,
                        city: shippingAddress.city.trim(),
                        state: shippingAddress.state.trim(),
                        postalCode: cleanPin,
                        country: shippingAddress.country || "India",
                        phone: verifiedUser.phone || shippingAddress.phone,
                        isDefault: true,
                    },
                });
            }
            // 3. Atomically check & deduct inventory with strict concurrency protection
            for (const item of totals.verifiedItems) {
                const updateResult = await tx.productVariant.updateMany({
                    where: {
                        id: item.variantId,
                        inventoryCount: { gte: item.quantity },
                    },
                    data: {
                        inventoryCount: { decrement: item.quantity },
                    },
                });
                if (updateResult.count === 0) {
                    throw new Error(`Insufficient stock available for "${item.title}".`);
                }
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { inventory: true },
                });
                if (variant && variant.inventory) {
                    await tx.inventory.update({
                        where: { variantId: item.variantId },
                        data: { quantity: { decrement: item.quantity } },
                    });
                }
            }
            if (orderData.couponId) {
                await tx.coupon.update({
                    where: { id: orderData.couponId },
                    data: { usedCount: { increment: 1 } },
                });
            }
            return await tx.order.create({ data: orderData });
        });
        res.json({
            success: true,
            message: "Order placed successfully. Payment awaiting manual verification.",
            orderNumber: order.orderNumber,
            orderId: order.id,
        });
    }
    catch (err) {
        console.error("submit-upi-payment error:", err);
        res.status(500).json({ error: err.message || "Failed to submit UPI payment order." });
    }
});
// 5. Submit Cash on Delivery (COD) Order
router.post("/submit-cod", async (req, res) => {
    try {
        const { cartItems, couponCode, shippingAddress } = req.body;
        const authHeader = req.headers.authorization;
        // 1. Enforce Authentication & Verified Customer Session
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentication required. Please verify your mobile number first." });
        }
        let userId = null;
        let verifiedUser = null;
        try {
            const decoded = jsonwebtoken_1.default.verify(authHeader.split(" ")[1], JWT_SECRET);
            if (decoded.userId) {
                userId = decoded.userId;
                verifiedUser = await db_js_1.prisma.user.findUnique({ where: { id: decoded.userId } });
            }
        }
        catch (e) {
            return res.status(401).json({ error: "Session expired or invalid session token. Please re-verify your mobile number." });
        }
        if (!verifiedUser || !verifiedUser.phoneVerified) {
            return res.status(403).json({ error: "Mobile phone verification is required before placing an order." });
        }
        if (verifiedUser.isBlocked) {
            return res.status(403).json({ error: "Your account has been blocked. Please contact support." });
        }
        // 2. Validate Address Fields & PIN Code Format
        if (!shippingAddress ||
            !shippingAddress.fullName ||
            !shippingAddress.streetAddress ||
            !shippingAddress.city ||
            !shippingAddress.state ||
            !shippingAddress.postalCode) {
            return res.status(400).json({ error: "Complete shipping address (Full Name, Street, City, State, PIN Code) is required." });
        }
        const cleanPin = String(shippingAddress.postalCode).trim();
        if (!/^\d{6}$/.test(cleanPin)) {
            return res.status(400).json({ error: "Please enter a valid 6-digit Indian PIN code." });
        }
        // 3. Authoritative Server-Side Calculation & Inventory Check (isCOD = true)
        let totals;
        try {
            totals = await calculateAuthoritativeTotals(cartItems, couponCode, userId || undefined, true);
        }
        catch (calcErr) {
            if (calcErr.message && calcErr.message.includes("Insufficient stock")) {
                return res.status(409).json({ error: calcErr.message });
            }
            return res.status(400).json({ error: calcErr.message || "Invalid cart items or quantities." });
        }
        const orderNumber = `FF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const orderData = {
            orderNumber,
            userId,
            status: "PENDING",
            subtotal: totals.subtotal,
            discountAmount: totals.discountAmount,
            shippingAmount: totals.shippingAmount,
            totalAmount: totals.totalAmount,
            shippingAddressJson: JSON.stringify({
                ...shippingAddress,
                postalCode: cleanPin,
                phone: verifiedUser.phone || shippingAddress.phone,
            }),
            shippingMethod: "Standard Delivery",
            couponId: totals.appliedCoupon ? totals.appliedCoupon.id : null,
            items: {
                create: totals.verifiedItems.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    title: item.title,
                    sku: item.sku,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.total,
                })),
            },
            payments: {
                create: {
                    paymentMethod: "COD",
                    status: "PENDING",
                    amount: totals.totalAmount,
                },
            },
        };
        const order = await db_js_1.prisma.$transaction(async (tx) => {
            // 1. Save/Update Customer Name & Email on Verified User
            const nameParts = String(shippingAddress.fullName || "").trim().split(" ");
            const firstName = nameParts[0] || "Collector";
            const lastName = nameParts.slice(1).join(" ") || "Customer";
            await tx.user.update({
                where: { id: verifiedUser.id },
                data: {
                    firstName,
                    lastName,
                    email: shippingAddress.email ? shippingAddress.email.trim().toLowerCase() : verifiedUser.email,
                },
            });
            // 2. Save/UPSERT Delivery Address against Verified Customer Identity
            const existingAddress = await tx.address.findFirst({
                where: {
                    userId: verifiedUser.id,
                    streetAddress: shippingAddress.streetAddress.trim(),
                    postalCode: cleanPin,
                },
            });
            if (existingAddress) {
                await tx.address.update({
                    where: { id: existingAddress.id },
                    data: {
                        fullName: shippingAddress.fullName.trim(),
                        streetAddress: shippingAddress.streetAddress.trim(),
                        apartment: shippingAddress.apartment ? shippingAddress.apartment.trim() : null,
                        city: shippingAddress.city.trim(),
                        state: shippingAddress.state.trim(),
                        postalCode: cleanPin,
                        country: shippingAddress.country || "India",
                        phone: verifiedUser.phone || shippingAddress.phone,
                    },
                });
            }
            else {
                await tx.address.create({
                    data: {
                        userId: verifiedUser.id,
                        fullName: shippingAddress.fullName.trim(),
                        streetAddress: shippingAddress.streetAddress.trim(),
                        apartment: shippingAddress.apartment ? shippingAddress.apartment.trim() : null,
                        city: shippingAddress.city.trim(),
                        state: shippingAddress.state.trim(),
                        postalCode: cleanPin,
                        country: shippingAddress.country || "India",
                        phone: verifiedUser.phone || shippingAddress.phone,
                        isDefault: true,
                    },
                });
            }
            // 3. Atomically check & deduct inventory
            for (const item of totals.verifiedItems) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { inventory: true, product: true },
                });
                if (!variant) {
                    throw new Error(`Product variant ${item.title} no longer exists.`);
                }
                const currentStock = variant.inventory ? variant.inventory.quantity : variant.inventoryCount;
                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for "${variant.product.name}". Only ${currentStock} available.`);
                }
                if (variant.inventory) {
                    await tx.inventory.update({
                        where: { variantId: item.variantId },
                        data: { quantity: { decrement: item.quantity } },
                    });
                }
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: { inventoryCount: { decrement: item.quantity } },
                });
            }
            if (orderData.couponId) {
                await tx.coupon.update({
                    where: { id: orderData.couponId },
                    data: { usedCount: { increment: 1 } },
                });
            }
            return await tx.order.create({ data: orderData });
        });
        res.json({
            success: true,
            message: "Cash on Delivery order created successfully.",
            orderNumber: order.orderNumber,
            orderId: order.id,
        });
    }
    catch (err) {
        console.error("submit-cod error:", err);
        res.status(500).json({ error: err.message || "Failed to submit COD order." });
    }
});
// POST /api/checkout/validate-cart & POST /api/cart/validate — Batched Cart Validation & Reconciliation
async function handleValidateCart(req, res) {
    try {
        const { items } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return res.json({
                success: true,
                valid: true,
                items: [],
                removedItems: [],
                updatedItems: [],
            });
        }
        const variantIds = items
            .map((i) => String(i.variantId || "").trim())
            .filter(Boolean);
        const dbVariants = await db_js_1.prisma.productVariant.findMany({
            where: {
                id: { in: variantIds },
                product: { status: "ACTIVE" },
            },
            include: {
                product: {
                    include: {
                        images: { orderBy: { sortOrder: "asc" }, take: 1 },
                    },
                },
                inventory: true,
            },
        });
        const dbMap = new Map(dbVariants.map((v) => [v.id, v]));
        const validItems = [];
        const removedItems = [];
        const updatedItems = [];
        for (const item of items) {
            const dbVariant = dbMap.get(item.variantId);
            if (!dbVariant || dbVariant.product.status !== "ACTIVE") {
                removedItems.push({
                    variantId: item.variantId,
                    productId: item.productId,
                    title: item.title || "Item no longer available",
                    reason: "PRODUCT_DELETED_OR_INACTIVE",
                });
                continue;
            }
            const availableStock = dbVariant.inventory
                ? dbVariant.inventory.quantity
                : dbVariant.inventoryCount;
            if (availableStock <= 0) {
                removedItems.push({
                    variantId: item.variantId,
                    productId: item.productId,
                    title: dbVariant.product.name,
                    reason: "OUT_OF_STOCK",
                });
                continue;
            }
            let clampedQty = Number(item.quantity) || 1;
            let qtyChanged = false;
            if (clampedQty > availableStock) {
                clampedQty = availableStock;
                qtyChanged = true;
            }
            const freshPrice = dbVariant.price;
            const priceChanged = Number(item.price) !== freshPrice;
            const freshImage = dbVariant.imageUrl || dbVariant.product.images[0]?.url || item.image || "";
            const freshTitle = dbVariant.product.name;
            const freshVariantTitle = dbVariant.title;
            const validItem = {
                id: item.id || `${dbVariant.id}-${Date.now()}`,
                variantId: dbVariant.id,
                productId: dbVariant.productId,
                title: freshTitle,
                variantTitle: freshVariantTitle,
                price: freshPrice,
                image: freshImage,
                quantity: clampedQty,
                sku: dbVariant.sku,
                brand: dbVariant.product.brand || item.brand || "FictionFigure",
            };
            if (priceChanged || qtyChanged) {
                updatedItems.push({
                    variantId: dbVariant.id,
                    oldPrice: item.price,
                    newPrice: freshPrice,
                    oldQuantity: item.quantity,
                    newQuantity: clampedQty,
                    reason: priceChanged && qtyChanged ? "PRICE_AND_STOCK_UPDATED" : priceChanged ? "PRICE_UPDATED" : "STOCK_CLAMPED",
                });
            }
            validItems.push(validItem);
        }
        return res.json({
            success: true,
            valid: removedItems.length === 0 && updatedItems.length === 0,
            items: validItems,
            removedItems,
            updatedItems,
        });
    }
    catch (e) {
        console.error("validate-cart error:", e);
        return res.status(500).json({ success: false, error: "Failed to validate cart" });
    }
}
router.post("/validate-cart", handleValidateCart);
router.post("/validate", handleValidateCart);
const orders_js_1 = require("./orders.js");
// Fixed routes FIRST
router.get("/my-orders", orders_js_1.handleGetMyOrders);
router.get("/orders/my-orders", orders_js_1.handleGetMyOrders);
// Parameterized routes AFTER
router.get("/orders/:id", orders_js_1.handleGetOrderDetails);
router.get("/order/:id", orders_js_1.handleGetOrderDetails);
exports.default = router;
