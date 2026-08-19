import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

/**
 * GET /api/products/categories
 * GET /api/categories
 * Public Endpoint for Active Categories with Product Counts
 */
export async function handleGetCategories(_req: any, res: any) {
  try {
    const categories = await prisma.category.findMany({
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
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch active categories" });
  }
}

router.get("/", handleGetCategories);
router.get("/categories", handleGetCategories);
router.get("/public", handleGetCategories);

export default router;
