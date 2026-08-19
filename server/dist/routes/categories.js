"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCategoriesCache = clearCategoriesCache;
exports.handleGetCategories = handleGetCategories;
const express_1 = require("express");
const db_js_1 = require("../db.js");
const router = (0, express_1.Router)();
let cachedCategoriesData = null;
let lastCategoriesCacheTime = 0;
let pendingCategoriesPromise = null;
const CATEGORIES_CACHE_TTL = 30 * 1000; // 30 seconds TTL
function clearCategoriesCache() {
    cachedCategoriesData = null;
    lastCategoriesCacheTime = 0;
    pendingCategoriesPromise = null;
}
async function handleGetCategories(_req, res) {
    try {
        const now = Date.now();
        if (cachedCategoriesData && now - lastCategoriesCacheTime < CATEGORIES_CACHE_TTL) {
            return res.status(200).json(cachedCategoriesData);
        }
        if (!pendingCategoriesPromise) {
            pendingCategoriesPromise = (async () => {
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
                lastCategoriesCacheTime = Date.now();
                return responseData;
            })().finally(() => {
                pendingCategoriesPromise = null;
            });
        }
        const responseData = await pendingCategoriesPromise;
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
