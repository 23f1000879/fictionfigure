import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

const router = Router();

// GET /api/payments/status/:orderNumber — Fetch Payment Status for Order
router.get("/status/:orderNumber", async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ orderNumber }, { id: orderNumber }] },
      include: { payments: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const payment = order.payments[0];

    res.json({
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      paymentMethod: payment?.paymentMethod || "UPI",
      paymentStatus: payment?.status || "PENDING",
      utr: payment?.transactionRef || null,
      amount: order.totalAmount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch payment status" });
  }
});

export default router;
