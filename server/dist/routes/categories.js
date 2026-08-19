"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCategoriesCache = clearCategoriesCache;
exports.handleGetCategories = handleGetCategories;
const express_1 = require("express");
const db_js_1 = require("../db.js");
const router = (0, express_1.Router)();
let cachedCategoriesData = null;
let lastCategoriesCacheTime = 0;
const CATEGORIES_CACHE_TTL = 10 * 1000; // 10 seconds TTL
function clearCategoriesCache() {
    cachedCategoriesData = null;
    lastCategoriesCacheTime = 0;
}
async function handleGetCategories(_req, res) {
    try {
        const now = Date.now();
        if (cachedCategoriesData && now - lastCategoriesCacheTime < CATEGORIES_CACHE_TTL) {
            return res.status(200).json(cachedCategoriesData);
        }
        const categories = await db_js_1.prisma.category.findMany({
            orderBy: {
                name: "asc",
            },
            include: {
                _count: {
                    select: {
                        products: {
                            where: {
                                status: "ACTIVE",
                            },
                        },
                    },
                },
            },
        });
        const responseData = { categories };
        cachedCategoriesData = responseData;
        lastCategoriesCacheTime = now;
        return res.status(200).json(responseData);
    }
    catch (error) {
        console.error("[CATEGORIES]", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch active categories",
        });
    }
}
router.get("/", handleGetCategories);
router.get("/categories", handleGetCategories);
router.get("/public", handleGetCategories);
exports.default = router;
