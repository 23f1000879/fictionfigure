import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

export async function handleGetCategories(_req: any, res: any) {
  try {
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

    return res.status(200).json({
      categories,
    });
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
