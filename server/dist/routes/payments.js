"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const router = (0, express_1.Router)();
// GET /api/payments/status/:orderNumber — Fetch Payment Status for Order
router.get("/status/:orderNumber", async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const order = await db_js_1.prisma.order.findFirst({
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
    }
    catch (err) {
        res.status(500).json({ error: err.message || "Failed to fetch payment status" });
    }
});
exports.default = router;
