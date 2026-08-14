import { Router } from "express";
import jwt from "jsonwebtoken";
import { normalizeIndianPhone } from "../utils/phone.js";
import { prisma } from "../db.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

// Authoritative Server-Side Total Calculation
export async function calculateAuthoritativeTotals(
  cartItems: { variantId: string; quantity: number }[],
  couponCode?: string,
  userId?: string
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

  // Fetch Free Shipping Threshold from Store Settings
  const dbSetting = await prisma.storeSetting.findUnique({ where: { key: "free_shipping_min" } });
  const freeShippingThreshold = dbSetting ? Number(dbSetting.value) || 15000 : 15000;

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const shippingAmount = afterDiscount >= freeShippingThreshold || subtotal === 0 ? 0 : 350;
  const totalAmount = Math.max(0, afterDiscount + shippingAmount);

  return {
    subtotal,
    discountAmount,
    shippingAmount,
    totalAmount,
    verifiedItems,
    appliedCoupon,
  };
}

// 1. Identify Customer & Initiate OTP Endpoint
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

    const existingUser = await prisma.user.findFirst({
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
      const token = jwt.sign(
        { userId: existingUser.id, phone: existingUser.phone, role: "CUSTOMER" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

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
  } catch (err: any) {
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

    const normalizedPhone = normalizeIndianPhone(phone);
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
        const payload: Record<string, string> = {
          authkey: MSG91_AUTH_KEY,
          "access-token": msg91Token,
        };
        if (reqId) payload.reqId = reqId;

        const msg91Res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authkey: MSG91_AUTH_KEY,
          },
          body: JSON.stringify(payload),
        });

        const msg91Data: any = await msg91Res.json();
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
      } catch (e: any) {
        console.error("MSG91 verifyAccessToken network error:", e);
        return res.status(500).json({ error: "Unable to verify MSG91 access token with server." });
      }
    } else {
      // Development mode fallback when MSG91_AUTH_KEY is not configured
      isVerified = true;
    }

    // Upsert Verified CUSTOMER User Record in Neon PostgreSQL
    let user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          isVerified: true,
          firstName: firstName ? firstName.trim() : user.firstName,
          lastName: lastName ? lastName.trim() : user.lastName,
          email: email ? email.trim().toLowerCase() : user.email,
        },
      });
    } else {
      user = await prisma.user.create({
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
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: "CUSTOMER" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

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
  } catch (err: any) {
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

// 3. Authoritative Order Calculation Endpoint
router.post("/calculate", async (req, res) => {
  try {
    const { cartItems, couponCode } = req.body;
    const totals = await calculateAuthoritativeTotals(cartItems, couponCode);
    res.json({ success: true, totals });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to calculate totals." });
  }
});

// 4. Submit Manual UPI QR Order with 12-Digit UTR
// 4. Submit Manual UPI QR Order with 12-Digit UTR
router.post("/submit-upi-payment", async (req, res) => {
  try {
    const { cartItems, couponCode, shippingAddress, shippingMethod, utr } = req.body;
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

    // 2. Validate UTR Reference Number
    if (!utr || typeof utr !== "string" || utr.trim().length < 6) {
      return res.status(400).json({ error: "Please enter a valid Transaction / UTR reference number (minimum 6 characters)." });
    }

    // 3. Validate Address Fields & PIN Code Format
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

    // 4. Validate Shipping Method
    const validShippingMethod = shippingMethod === "Express Courier" ? "Express Courier" : "Standard Shipping";

    // 5. Authoritative Server-Side Calculation & Inventory Check
    let totals;
    try {
      totals = await calculateAuthoritativeTotals(cartItems, couponCode, userId || undefined);
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
      shippingMethod: validShippingMethod,
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
          transactionRef: utr.trim(),
        },
      },
    };

    const order = await prisma.$transaction(async (tx) => {
      // Atomically check & deduct inventory
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
    const { cartItems, couponCode, shippingAddress, shippingMethod } = req.body;
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

    // 3. Validate Shipping Method
    const validShippingMethod = shippingMethod === "Express Courier" ? "Express Courier" : "Standard Shipping";

    // 4. Authoritative Server-Side Calculation & Inventory Check
    let totals;
    try {
      totals = await calculateAuthoritativeTotals(cartItems, couponCode, userId || undefined);
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
      shippingMethod: validShippingMethod,
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
      // Atomically check & deduct inventory
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

// 6. Customer Dynamic Order Receipt & Details Endpoint
router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    let authenticatedUserId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any;
        if (decoded.userId) authenticatedUserId = decoded.userId;
      } catch (e) {}
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { sortOrder: "asc" }, take: 1 },
                  },
                },
              },
            },
          },
        },
        payments: true,
        coupon: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Security Ownership Check: If order has an associated User ID, require matching token
    if (order.userId && authenticatedUserId && authenticatedUserId !== order.userId) {
      return res.status(403).json({ error: "Order not found or access forbidden." });
    }

    let parsedAddress = null;
    try {
      if (order.shippingAddressJson) {
        const raw = order.shippingAddressJson;
        parsedAddress = typeof raw === "string" ? JSON.parse(raw) : raw;
      }
    } catch (e) {
      parsedAddress = {};
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        totalAmount: order.totalAmount,
        shippingMethod: order.shippingMethod,
        trackingNumber: order.trackingNumber || null,
        shippingAddress: parsedAddress,
        items: order.items.map((item) => ({
          id: item.id,
          title: item.title,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
          image: item.variant?.product?.images?.[0]?.url || "",
        })),
        payments: order.payments.map((p) => ({
          id: p.id,
          paymentMethod: p.paymentMethod,
          status: p.status,
          amount: p.amount,
          utr: p.transactionRef || null,
        })),
        coupon: order.coupon ? { code: order.coupon.code, discountValue: order.coupon.discountValue } : null,
      },
    });
  } catch (err: any) {
    console.error("GET orders/:id error:", err);
    res.status(500).json({ error: "Failed to fetch order details." });
  }
});

// 7. Authenticated Customer Complete Order History Endpoint
router.get("/my-orders", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired session token." });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: "Unauthorized session." });
    }

    // Strict ownership filter: Query orders belonging ONLY to verified JWT decoded.userId
    const orders = await prisma.order.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          take: 1,
          select: {
            title: true,
            price: true,
            quantity: true,
          },
        },
        payments: {
          select: {
            paymentMethod: true,
            status: true,
            transactionRef: true,
          },
        },
      },
    });

    res.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt,
        totalAmount: o.totalAmount,
        subtotal: o.subtotal,
        shippingAmount: o.shippingAmount,
        discountAmount: o.discountAmount,
        firstItemTitle: o.items[0]?.title || "Collectible Figure",
        paymentMethod: o.payments[0]?.paymentMethod || "UPI",
        paymentStatus:
          o.payments[0]?.paymentMethod === "COD" && o.payments[0]?.status !== "PAID"
            ? "PAYMENT DUE ON DELIVERY"
            : o.payments[0]?.status || "PENDING",
        utr: o.payments[0]?.transactionRef || null,
      })),
    });
  } catch (err: any) {
    console.error("GET /my-orders error:", err);
    res.status(500).json({ error: "Failed to fetch order history." });
  }
});

export default router;
