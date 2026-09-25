import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

/**
 * Shared Helper to resolve customer ownership and format order receipt
 * HARDENED AUTHORIZATION: Strict User ID Match
 */
export async function handleGetOrderDetails(req: any, res: any) {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required. Please sign in to view this order receipt.",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: "Authentication required. Please sign in to view this order receipt.",
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: "Authentication required. Please sign in to view this order receipt.",
      });
    }

    const authenticatedUserId = decoded.userId;

    const user = await prisma.user.findUnique({
      where: { id: authenticatedUserId },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        error: "Authentication required. Please sign in to view this order receipt.",
      });
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

    // HARDENED CUSTOMER AUTHORIZATION CHECK
    // Order userId MUST equal authenticated user id (unless user has ADMIN role)
    const isOwner = order.userId === authenticatedUserId;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "Access restricted. You do not have permission to view this order.",
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
          variantTitle: item.variant?.title || "",
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

    // HARDENED ORDER HISTORY QUERY: Strictly scoped to authenticated user ID
    const orders = await prisma.order.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
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
      orders: orders.map((o) => {
        const primaryItem = o.items[0];
        const primaryImage =
          primaryItem?.variant?.product?.images?.[0]?.url ||
          primaryItem?.variant?.imageUrl ||
          (primaryItem?.variant?.product as any)?.imageUrl ||
          "";
        const totalItemsCount = o.items.reduce((acc, item) => acc + item.quantity, 0);

        return {
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          createdAt: o.createdAt,
          totalAmount: o.totalAmount,
          subtotal: o.subtotal,
          shippingAmount: o.shippingAmount,
          discountAmount: o.discountAmount,
          trackingNumber: o.trackingNumber || null,
          itemCount: totalItemsCount,
          firstItemTitle: primaryItem?.title || "Collectible Figure",
          image: primaryImage,
          paymentMethod: o.payments[0]?.paymentMethod || "UPI",
          paymentStatus:
            o.payments[0]?.paymentMethod === "COD" && o.payments[0]?.status !== "PAID"
              ? "PAYMENT DUE ON DELIVERY"
              : o.payments[0]?.status || "PENDING",
          utr: o.payments[0]?.transactionRef || null,
          items: o.items.map((item) => ({
            id: item.id,
            title: item.title,
            variantTitle: item.variant?.title || "",
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            image:
              item.variant?.product?.images?.[0]?.url ||
              item.variant?.imageUrl ||
              (item.variant?.product as any)?.imageUrl ||
              "",
          })),
        };
      }),
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
