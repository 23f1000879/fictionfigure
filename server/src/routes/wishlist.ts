import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../db.js";

const router = Router();

// 1. Get Authenticated Customer Wishlist (GET /api/wishlist)
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: "asc" },
                },
                category: true,
              },
            },
          },
        },
      },
    });

    if (!wishlist) {
      return res.json({ success: true, items: [], products: [] });
    }

    const products = wishlist.items
      .filter((item) => item.product)
      .map((item) => item.product);

    res.json({
      success: true,
      items: wishlist.items,
      products,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch wishlist items." });
  }
});

// 2. Toggle Item in Wishlist (POST /api/wishlist/toggle)
router.post("/toggle", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    // Ensure product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    // Get or create user wishlist
    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId } });
    }

    // Check if item is already in wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    if (existingItem) {
      // Remove from wishlist
      await prisma.wishlistItem.delete({ where: { id: existingItem.id } });
      return res.json({ success: true, inWishlist: false, message: "Removed from wishlist." });
    } else {
      // Add to wishlist
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
      return res.json({ success: true, inWishlist: true, message: "Added to wishlist." });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update wishlist." });
  }
});

export default router;
