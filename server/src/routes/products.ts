import { Router } from "express";
import { prisma } from "../db.js";
import { handleGetCategories } from "./categories.js";

const router = Router();

// In-memory metadata cache for active categories, brands, and franchises (60s TTL)
let cachedCategories: any[] | null = null;
let cachedBrands: string[] | null = null;
let cachedFranchises: string[] | null = null;
let lastMetaCacheTime = 0;
const META_CACHE_TTL = 60 * 1000;

let cachedCatalogResponse: Record<string, { data: any; time: number }> = {};
let pendingCatalogPromises: Record<string, Promise<any>> = {};
const CATALOG_CACHE_TTL = 30 * 1000; // 30s TTL

export function clearProductsMetaCache() {
  cachedCategories = null;
  cachedBrands = null;
  cachedFranchises = null;
  lastMetaCacheTime = 0;
  cachedCatalogResponse = {};
  pendingCatalogPromises = {};
}

// GET /api/products — Database-Driven Product Catalog & Dynamic Facets
router.get("/", async (req, res) => {
  try {
    const cacheKey = JSON.stringify(req.query);
    const now = Date.now();

    if (cachedCatalogResponse[cacheKey] && now - cachedCatalogResponse[cacheKey].time < CATALOG_CACHE_TTL) {
      return res.json(cachedCatalogResponse[cacheKey].data);
    }

    if (!pendingCatalogPromises[cacheKey]) {
      pendingCatalogPromises[cacheKey] = (async () => {

    const {
      query,
      category,
      brand,
      franchise,
      minPrice,
      maxPrice,
      inStockOnly,
      sortBy,
      limit,
      page,
    } = req.query;

    const where: any = { status: "ACTIVE" };

    // 1. Text Search Filter (name, description, brand, franchise, sku)
    if (query && String(query).trim()) {
      const q = String(query).trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { franchise: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    // 2. Category Filter (slug or ID)
    if (category) {
      const catStr = String(category);
      where.category = {
        OR: [{ slug: catStr }, { id: catStr }],
      };
    }

    // 3. Brand Filter
    if (brand) {
      where.brand = String(brand);
    }

    // 4. Franchise Filter
    if (franchise) {
      where.franchise = String(franchise);
    }

    // 5. Price Range Filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // 6. In-Stock Only Filter
    if (inStockOnly === "true") {
      where.variants = {
        some: {
          inventoryCount: { gt: 0 },
        },
      };
    }

    // 7. Sorting Logic
    let orderBy: any = { createdAt: "desc" }; // default: newest
    if (sortBy === "featured") {
      orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
    } else if (sortBy === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sortBy === "price_desc") {
      orderBy = { price: "desc" };
    } else if (sortBy === "name_asc") {
      orderBy = { name: "asc" };
    } else if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    }

    // Pagination Parameters
    const takeNum = Number(limit) || 12;
    const pageNum = Number(page) || 1;
    const skipNum = (pageNum - 1) * takeNum;

    // Execute paginated products + totalCount queries
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        take: takeNum,
        skip: skipNum,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Check if metadata is cached
    const currentNow = Date.now();
    if (!cachedCategories || !cachedBrands || !cachedFranchises || currentNow - lastMetaCacheTime > META_CACHE_TTL) {
      const [activeCategories, allActiveProducts] = await Promise.all([
        prisma.category.findMany({
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
        }),
        prisma.product.findMany({
          where: { status: "ACTIVE" },
          select: { brand: true, franchise: true },
        }),
      ]);

      const brandsSet = new Set<string>();
      const franchisesSet = new Set<string>();

      for (const p of allActiveProducts) {
        if (p.brand && p.brand.trim()) brandsSet.add(p.brand.trim());
        if (p.franchise && p.franchise.trim()) franchisesSet.add(p.franchise.trim());
      }

      cachedCategories = activeCategories;
      cachedBrands = Array.from(brandsSet).sort();
      cachedFranchises = Array.from(franchisesSet).sort();
      lastMetaCacheTime = currentNow;
    }

    const categories = cachedCategories;
    const brands = cachedBrands;
    const franchises = cachedFranchises;

        const responsePayload = {
          products,
          totalCount,
          totalPages: Math.ceil(totalCount / takeNum) || 1,
          currentPage: pageNum,
          categories,
          brands,
          franchises,
        };

        cachedCatalogResponse[cacheKey] = { data: responsePayload, time: Date.now() };
        return responsePayload;
      })().finally(() => {
        delete pendingCatalogPromises[cacheKey];
      });
    }

    const responsePayload = await pendingCatalogPromises[cacheKey];
    res.json(responsePayload);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch products" });
  }
});

// GET /api/products/categories — Public Endpoint for Active Categories with Product Counts
router.get("/categories", handleGetCategories);
router.get("/categories/public", handleGetCategories);

// GET /api/products/:slug — Single Product Detail View
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        reviews: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!product || product.status !== "ACTIVE") {
      return res.status(404).json({ error: "Product not found or currently unavailable" });
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: "ACTIVE",
      },
      take: 4,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });

    res.json({ product, relatedProducts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch product details" });
  }
});

export default router;
