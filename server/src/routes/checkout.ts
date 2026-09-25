import { Router } from "express";
import jwt from "jsonwebtoken";
import { normalizeIndianPhone } from "../utils/phone.js";
import { prisma } from "../db.js";
import { getStoreSettingsHelper } from "./settings.js";
import bcrypt from "bcryptjs";
import { verifyMsg91AccessToken, phoneBindingOk } from "../utils/msg91.js";
import { MIN_PASSWORD_LENGTH, hasUsablePassword, allowAttempt, clientIp, TOO_MANY_ATTEMPTS, phoneAccountState } from "../utils/security.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

// Authoritative Server-Side Total Calculation
export async function calculateAuthoritativeTotals(
  cartItems: { variantId: string; quantity: number }[],
  couponCode?: string,
  userId?: string,
  isCOD: boolean = false
) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const variantIds = cartItems.map((item) => item.variantId);
  const dbVariants = await prisma.productVariant.findMany({
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
    const coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });

    if (coupon && coupon.isActive) {
      const now = new Date();
      const isStarted = !coupon.startDate || new Date(coupon.startDate) <= now;
      const notExpired = !coupon.endDate || new Date(coupon.endDate) >= now;
      const underMaxUsage = coupon.usedCount < coupon.maxUsage;
      const meetsMinOrder = subtotal >= coupon.minOrderValue;

      let userEligible = true;
      if (userId && coupon.perCustomerLimit) {
        const usageCount = await prisma.order.count({
          where: { userId, couponId: coupon.id, status: { not: "CANCELLED" } },
        });
        if (usageCount >= coupon.perCustomerLimit) userEligible = false;
      }

      if (isStarted && notExpired && underMaxUsage && meetsMinOrder && userEligible) {
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
          }
        } else {
          discountAmount = Math.min(coupon.discountValue, subtotal);
        }
        discountAmount = Math.round(discountAmount);
        appliedCoupon = coupon;
      }
    }
  }

  // Admin-Controlled Dynamic Store Settings for Shipping & Zero COD Handling Fee
  const { shippingFee: configShippingFee, freeShippingThreshold: configThreshold } = await getStoreSettingsHelper();

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

// 1. Identify Customer: server decides the path; never issues a session and never sends OTP.
router.post("/auth/identify", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Mobile number is required." });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
    }

    const ip = clientIp(req);
    if (!allowAttempt(`phone-status-ip:${ip}`, 20, 15 * 60 * 1000) || !allowAttempt(`phone-status:${normalizedPhone}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
    }

    const user = await prisma.user.findFirst({ where: { phone: normalizedPhone }, select: { passwordHash: true } });
    res.json({ state: phoneAccountState(user), normalizedPhone });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to identify customer mobile number." });
  }
});

const SETUP_TOKEN_TTL = "15m";

/** Single-purpose token proving OTP ownership of a number; carries no userId, so it is never a session. */
function signPasswordSetupToken(phone: string) {
  return jwt.sign({ purpose: "password_setup", phone }, JWT_SECRET, { expiresIn: SETUP_TOKEN_TTL });
}

// 2. Verify MSG91 Widget Access Token Endpoint
// OTP proves control of the number *now*; it does not log anyone in by itself.
router.post(["/auth/verify-widget-token", "/auth/verify-otp"], async (req, res) => {
  try {
    const { phone, accessToken, widgetToken, reqId } = req.body;

    if (!allowAttempt(`checkout-otp:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
    }

    if (!phone) {
      return res.status(400).json({ error: "Mobile number is required." });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
    }

    const verification = await verifyMsg91AccessToken(accessToken || widgetToken, reqId);
    if (!verification.ok) {
      return res.status(verification.status || 400).json({ error: verification.error });
    }

    const user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });

    // Existing account: the OTP must be proven to belong to this exact number.
    if (user && !phoneBindingOk(verification, normalizedPhone, "strict")) {
      return res.status(400).json({ error: "We couldn't confirm this number. Please verify it again with a new OTP." });
    }
    if (!user && !phoneBindingOk(verification, normalizedPhone, "lenient")) {
      return res.status(400).json({ error: "The verified mobile number does not match. Please verify this number again." });
    }

    if (user && user.isBlocked) {
      return res.status(403).json({ error: "ACCOUNT_BLOCKED", message: "Your account has been blocked. Please contact support." });
    }

    if (user && hasUsablePassword(user.passwordHash)) {
      return res.json({
        status: "LOGIN_REQUIRED",
        message: "This number already has an account. Sign in with your password to continue checkout.",
      });
    }

    return res.json({
      status: user ? "PASSWORD_SETUP_REQUIRED" : "NEW_ACCOUNT",
      setupToken: signPasswordSetupToken(normalizedPhone),
      firstName: user?.firstName || undefined,
      lastName: user?.lastName || undefined,
      message: user
        ? "Number verified. Create a password to secure your account and continue."
        : "Number verified. Create a password to set up your account and continue.",
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to verify the OTP. Please try again." });
  }
});

// 2b. Complete account after OTP: a password is always required before any session is issued.
router.post("/auth/complete-account", async (req, res) => {
  try {
    const { setupToken, password, firstName, lastName } = req.body;

    if (!allowAttempt(`checkout-complete:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
    }

    let claims: any;
    try {
      claims = jwt.verify(String(setupToken || ""), JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Verification expired. Please verify your number again." });
    }
    if (!claims || claims.purpose !== "password_setup" || !claims.phone) {
      return res.status(401).json({ error: "Invalid verification. Please verify your number again." });
    }

    if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }

    const phone = String(claims.phone);
    const passwordHash = await bcrypt.hash(String(password), 10);
    let user = await prisma.user.findFirst({ where: { phone } });

    if (user) {
      if (user.isBlocked) {
        return res.status(403).json({ error: "ACCOUNT_BLOCKED", message: "Your account has been blocked. Please contact support." });
      }
      if (hasUsablePassword(user.passwordHash)) {
        return res.status(409).json({ error: "LOGIN_REQUIRED", message: "This account already has a password. Please sign in." });
      }
      // Legacy passwordless account: attach the new password.
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, phoneVerified: true, isVerified: true },
      });
    } else {
      const first = String(firstName || "").trim();
      const last = String(lastName || "").trim();
      if (!first || !last) {
        return res.status(400).json({ error: "First name and last name are required." });
      }
      try {
        user = await prisma.user.create({
          data: { phone, firstName: first, lastName: last, passwordHash, phoneVerified: true, isVerified: true, role: "CUSTOMER" },
        });
      } catch (dbErr: any) {
        if (dbErr.code === "P2002") {
          return res.status(409).json({ error: "LOGIN_REQUIRED", message: "This number already has an account. Please sign in." });
        }
        throw dbErr;
      }
    }

    const token = jwt.sign({ userId: user.id, phone: user.phone, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
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
  } catch (err: any) {
    res.status(500).json({ error: "Could not complete your account. Please try again." });
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const addresses = await prisma.address.findMany({
      where: { userId: decoded.userId },
      orderBy: { isDefault: "desc" },
    });

    res.json({ addresses });
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// Create New Address
router.post("/addresses", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { fullName, streetAddress, apartment, city, state, postalCode, country, phone, isDefault } = req.body || {};

    if (!fullName || !fullName.trim() || !streetAddress || !streetAddress.trim() || !city || !city.trim() || !state || !state.trim()) {
      return res.status(400).json({ error: "Please fill in all required address fields." });
    }

    const cleanPin = String(postalCode || "").trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({ error: "Please enter a valid 6-digit PIN code (e.g. 334001)." });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: decoded.userId },
        data: { isDefault: false },
      });
    }

    const existingCount = await prisma.address.count({ where: { userId: decoded.userId } });
    const makeDefault = isDefault || existingCount === 0;

    const newAddress = await prisma.address.create({
      data: {
        userId: decoded.userId,
        fullName: fullName.trim(),
        streetAddress: streetAddress.trim(),
        apartment: apartment ? String(apartment).trim() : null,
        city: city.trim(),
        state: state.trim(),
        postalCode: cleanPin,
        country: country || "India",
        phone: phone ? String(phone).trim() : "",
        isDefault: makeDefault,
      },
    });

    res.json({ success: true, address: newAddress });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create address." });
  }
});

// Edit Address
router.put("/addresses/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const addressId = req.params.id;

    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId: decoded.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Address not found." });
    }

    const { fullName, streetAddress, apartment, city, state, postalCode, country, phone, isDefault } = req.body || {};

    if (!fullName || !fullName.trim() || !streetAddress || !streetAddress.trim() || !city || !city.trim() || !state || !state.trim()) {
      return res.status(400).json({ error: "Please fill in all required address fields." });
    }

    const cleanPin = String(postalCode || "").trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({ error: "Please enter a valid 6-digit PIN code (e.g. 334001)." });
    }

    if (isDefault && !existing.isDefault) {
      await prisma.address.updateMany({
        where: { userId: decoded.userId },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        fullName: fullName.trim(),
        streetAddress: streetAddress.trim(),
        apartment: apartment ? String(apartment).trim() : null,
        city: city.trim(),
        state: state.trim(),
        postalCode: cleanPin,
        country: country || "India",
        phone: phone ? String(phone).trim() : existing.phone,
        isDefault: isDefault ?? existing.isDefault,
      },
    });

    res.json({ success: true, address: updatedAddress });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update address." });
  }
});

// Delete Address
router.delete("/addresses/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const addressId = req.params.id;

    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId: decoded.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Address not found." });
    }

    await prisma.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const nextFirst = await prisma.address.findFirst({
        where: { userId: decoded.userId },
        orderBy: { createdAt: "desc" },
      });
      if (nextFirst) {
        await prisma.address.update({
          where: { id: nextFirst.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete address." });
  }
});

// Set Address as Default
router.post(["/addresses/:id/default", "/addresses/:id/set-default"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const addressId = req.params.id;

    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId: decoded.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Address not found." });
    }

    await prisma.address.updateMany({
      where: { userId: decoded.userId },
      data: { isDefault: false },
    });

    const updated = await prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    res.json({ success: true, address: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to set default address." });
  }
});

// 3. Authoritative Order Calculation Endpoint
router.post("/calculate", async (req, res) => {
  try {
    const { cartItems, couponCode, paymentMethod } = req.body;
    const isCOD = paymentMethod === "COD";
    const totals = await calculateAuthoritativeTotals(cartItems, couponCode, undefined, isCOD);
    res.json({ success: true, totals });
  } catch (err: any) {
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

    let userId: string | null = null;
    let verifiedUser = null;
    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any;
      if (decoded.userId) {
        userId = decoded.userId;
        verifiedUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
      }
    } catch (e) {
      return res.status(401).json({ error: "Session expired or invalid session token. Please re-verify your mobile number." });
    }

    if (!verifiedUser || !verifiedUser.phoneVerified) {
      return res.status(403).json({ error: "Mobile phone verification is required before placing an order." });
    }

    if (verifiedUser.isBlocked) {
      return res.status(403).json({ error: "Your account has been blocked. Please contact support." });
    }

    // 2. Validate Address Fields & PIN Code Format
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.streetAddress ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode
    ) {
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
    } catch (calcErr: any) {
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

    const order = await prisma.$transaction(async (tx) => {
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
      } else {
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
  } catch (err: any) {
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

    let userId: string | null = null;
    let verifiedUser = null;
    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any;
      if (decoded.userId) {
        userId = decoded.userId;
        verifiedUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
      }
    } catch (e) {
      return res.status(401).json({ error: "Session expired or invalid session token. Please re-verify your mobile number." });
    }

    if (!verifiedUser || !verifiedUser.phoneVerified) {
      return res.status(403).json({ error: "Mobile phone verification is required before placing an order." });
    }

    if (verifiedUser.isBlocked) {
      return res.status(403).json({ error: "Your account has been blocked. Please contact support." });
    }

    // 2. Validate Address Fields & PIN Code Format
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.streetAddress ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode
    ) {
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
    } catch (calcErr: any) {
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

    const order = await prisma.$transaction(async (tx) => {
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
      } else {
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
  } catch (err: any) {
    console.error("submit-cod error:", err);
    res.status(500).json({ error: err.message || "Failed to submit COD order." });
  }
});

// POST /api/checkout/validate-cart & POST /api/cart/validate — Batched Cart Validation & Reconciliation
export async function handleValidateCart(req: any, res: any) {
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
      .map((i: any) => String(i.variantId || "").trim())
      .filter(Boolean);

    const dbVariants = await prisma.productVariant.findMany({
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
    const validItems: any[] = [];
    const removedItems: any[] = [];
    const updatedItems: any[] = [];

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
  } catch (e: any) {
    console.error("validate-cart error:", e);
    return res.status(500).json({ success: false, error: "Failed to validate cart" });
  }
}

router.post("/validate-cart", handleValidateCart);
router.post("/validate", handleValidateCart);

import { handleGetOrderDetails, handleGetMyOrders } from "./orders.js";

// Fixed routes FIRST
router.get("/my-orders", handleGetMyOrders);
router.get("/orders/my-orders", handleGetMyOrders);

// Parameterized routes AFTER
router.get("/orders/:id", handleGetOrderDetails);
router.get("/order/:id", handleGetOrderDetails);

export default router;
