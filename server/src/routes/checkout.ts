import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { normalizeIndianPhone } from "../utils/phone.js";

const router = Router();
const prisma = new PrismaClient();

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

// 1. Identify Customer Phone (Existing vs New)
router.post("/auth/identify", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Mobile number is required" });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
    }

    const existingUser = await prisma.user.findFirst({
      where: { phone: normalizedPhone, role: "CUSTOMER" },
    });

    if (existingUser && existingUser.phoneVerified) {
      const token = jwt.sign(
        { userId: existingUser.id, phone: existingUser.phone, role: "CUSTOMER" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        exists: true,
        phoneVerified: true,
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

    res.json({
      exists: false,
      requiresOtp: true,
      normalizedPhone,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to identify customer mobile number." });
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
router.post("/submit-upi-payment", async (req, res) => {
  try {
    const { cartItems, couponCode, shippingAddress, shippingMethod, utr } = req.body;
    const authHeader = req.headers.authorization;

    if (!utr || typeof utr !== "string" || utr.trim().length < 6) {
      return res.status(400).json({ error: "Please enter a valid Transaction / UTR reference number." });
    }

    const cleanUtr = utr.trim();

    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any;
        if (decoded.userId) userId = decoded.userId;
      } catch (e) {}
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.streetAddress || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({ error: "Complete shipping address is required." });
    }

    // Authoritative calculation
    const totals = await calculateAuthoritativeTotals(cartItems, couponCode, userId || undefined);

    const orderNumber = `FF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: "PENDING",
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingAmount: totals.shippingAmount,
        totalAmount: totals.totalAmount,
        shippingAddressJson: JSON.stringify(shippingAddress),
        shippingMethod: shippingMethod || "Standard Shipping",
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
            transactionRef: cleanUtr,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Order placed successfully. Payment awaiting manual verification.",
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  } catch (err: any) {
    console.error("submit-upi-payment error:", err);
    res.status(400).json({ error: err.message || "Failed to submit UPI payment order." });
  }
});

// 5. Submit Cash on Delivery (COD) Order
router.post("/submit-cod", async (req, res) => {
  try {
    const { cartItems, couponCode, shippingAddress, shippingMethod } = req.body;
    const authHeader = req.headers.authorization;

    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any;
        if (decoded.userId) userId = decoded.userId;
      } catch (e) {}
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.streetAddress || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({ error: "Complete shipping address is required." });
    }

    const totals = await calculateAuthoritativeTotals(cartItems, couponCode, userId || undefined);

    const orderNumber = `FF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: "PENDING",
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingAmount: totals.shippingAmount,
        totalAmount: totals.totalAmount,
        shippingAddressJson: JSON.stringify(shippingAddress),
        shippingMethod: shippingMethod || "Standard Shipping",
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
      },
    });

    res.json({
      success: true,
      message: "Cash on Delivery order created successfully.",
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  } catch (err: any) {
    console.error("submit-cod error:", err);
    res.status(400).json({ error: err.message || "Failed to submit COD order." });
  }
});

export default router;
