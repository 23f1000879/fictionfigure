import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

/**
 * Shared Helper to resolve customer ownership and format order receipt
 */
export async function handleGetOrderDetails(req: any, res: any) {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    let authenticatedUserId: string | null = null;
    let authenticatedUserPhone: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.userId) {
          authenticatedUserId = decoded.userId;
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { phone: true, role: true },
          });
          if (user?.phone) authenticatedUserPhone = user.phone;
        }
      } catch (e) {}
    }

    // Lookup order by UUID or public order number (e.g. FF-668844-971)
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: id }, { orderNumber: id }],
      },
      include: {
        user: true,
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

    // STRICT CUSTOMER OWNERSHIP SECURITY CHECK
    const isGuestOrder = !order.userId && !order.user?.phone;
    const isAuthenticated = Boolean(authenticatedUserId || authenticatedUserPhone);

    const authPhone10 = authenticatedUserPhone ? authenticatedUserPhone.replace(/\D/g, "").slice(-10) : "";
    const orderUserPhone10 = order.user?.phone ? order.user.phone.replace(/\D/g, "").slice(-10) : "";

    let orderAddressPhone10 = "";
    try {
      if (order.shippingAddressJson) {
        const parsed = typeof order.shippingAddressJson === "string" ? JSON.parse(order.shippingAddressJson) : order.shippingAddressJson;
        if (parsed.phone) orderAddressPhone10 = String(parsed.phone).replace(/\D/g, "").slice(-10);
      }
    } catch (e) {}

    const isMatchingOwner =
      isGuestOrder ||
      (authenticatedUserId && order.userId === authenticatedUserId) ||
      (authenticatedUserPhone && order.user?.phone === authenticatedUserPhone) ||
      (authPhone10 && orderUserPhone10 && authPhone10 === orderUserPhone10) ||
      (authPhone10 && orderAddressPhone10 && authPhone10 === orderAddressPhone10) ||
      (authenticatedUserPhone && order.shippingAddressJson?.includes(authenticatedUserPhone));

    if (!isMatchingOwner) {
      if (!isAuthenticated) {
        return res.status(401).json({
          error: "Authentication required. Please sign in to view this order receipt.",
        });
      }
      return res.status(404).json({
        error: "Order not found.",
      });
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
          productId: item.productId || item.variant?.productId || "",
          productSlug: item.variant?.product?.slug || "",
          title: item.title,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
          image: item.variant?.product?.images?.[0]?.url || "",
          isDelivered: order.status === "DELIVERED",
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
}

export async function handleGetMyOrders(req: any, res: any) {
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

    const userId = decoded.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });

    const ownerFilters: any[] = [{ userId }];
    if (user?.phone) {
      ownerFilters.push({ user: { phone: user.phone } });
      ownerFilters.push({ shippingAddressJson: { contains: user.phone } });
      const cleanPhone = user.phone.replace(/\D/g, "").slice(-10);
      if (cleanPhone) ownerFilters.push({ shippingAddressJson: { contains: cleanPhone } });
    }

    const orders = await prisma.order.findMany({
      where: { OR: ownerFilters },
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
}

/**
 * GET /api/orders/my-orders
 * GET /api/orders/my
 * Authenticated Customer Order History
 */
router.get("/my-orders", handleGetMyOrders);
router.get("/my", handleGetMyOrders);

/**
 * GET /api/orders/:id
 * GET /api/orders/order/:id
 */
router.get("/:id", handleGetOrderDetails);
router.get("/order/:id", handleGetOrderDetails);

export default router;
