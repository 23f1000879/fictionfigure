"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetCategories = handleGetCategories;
const express_1 = require("express");
const db_js_1 = require("../db.js");
const router = (0, express_1.Router)();
/**
 * GET /api/products/categories
 * GET /api/categories
 * Public Endpoint for Active Categories with Product Counts
 */
async function handleGetCategories(_req, res) {
    try {
        const categories = await db_js_1.prisma.category.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: {
                        products: {
                            where: { status: "ACTIVE" },
                        },
                    },
                },
            },
        });
        res.json({ categories });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch active categories" });
    }
}
router.get("/", handleGetCategories);
router.get("/categories", handleGetCategories);
router.get("/public", handleGetCategories);
exports.default = router;
