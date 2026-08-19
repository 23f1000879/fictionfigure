import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

let cachedCategoriesData: any = null;
let lastCategoriesCacheTime = 0;
const CATEGORIES_CACHE_TTL = 10 * 1000; // 10 seconds TTL

export function clearCategoriesCache() {
  cachedCategoriesData = null;
  lastCategoriesCacheTime = 0;
}

export async function handleGetCategories(_req: any, res: any) {
  try {
    const now = Date.now();
    if (cachedCategoriesData && now - lastCategoriesCacheTime < CATEGORIES_CACHE_TTL) {
      return res.status(200).json(cachedCategoriesData);
    }

    const categories = await prisma.category.findMany({
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
  } catch (error: any) {
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

export default router;
