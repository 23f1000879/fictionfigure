import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// POST /api/coupons/validate — Server-Side Coupon Validation & Discount Calculation
router.post("/validate", async (req, res) => {
  try {
    const { code, cartSubtotal, userId } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ valid: false, error: "Coupon code is required." });
    }

    const subtotal = Number(cartSubtotal) || 0;
    const cleanCode = code.toUpperCase().trim();

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ valid: false, error: "Invalid or inactive coupon code." });
    }

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return res.status(400).json({ valid: false, error: "This coupon is not active yet." });
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return res.status(400).json({ valid: false, error: "This coupon has expired." });
    }

    if (coupon.usedCount >= coupon.maxUsage) {
      return res.status(400).json({ valid: false, error: "This coupon usage limit has been reached." });
    }

    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        valid: false,
        error: `Minimum order amount of ₹${coupon.minOrderValue.toLocaleString("en-IN")} required to use code ${coupon.code}.`,
      });
    }

    // Per-customer usage limit check
    if (userId && coupon.perCustomerLimit) {
      const userUsageCount = await prisma.order.count({
        where: { userId, couponId: coupon.id, status: { not: "CANCELLED" } },
      });

      if (userUsageCount >= coupon.perCustomerLimit) {
        return res.status(400).json({
          valid: false,
          error: `You have already used code ${coupon.code} the maximum allowed times (${coupon.perCustomerLimit}).`,
        });
      }
    }

    // Calculate exact server-side discount
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    discountAmount = Math.round(discountAmount);

    res.json({
      valid: true,
      discountAmount,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: "Failed to validate coupon" });
  }
});

export default router;
