import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "../middleware/auth.js";
import { prisma } from "../db.js";
import { DEFAULT_SETTINGS, clearSettingsCache } from "./settings.js";

const router = Router();

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });
}

// Multer Storage Configuration for Local Development Storage
const uploadsDir = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB Max File Size
  },
  fileFilter: (_req, file, cb) => {
    const validMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (validMimeTypes.includes(file.mimetype) || [".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only JPG, PNG, and WEBP images up to 5 MB are allowed."));
    }
  },
});

// 1. Image Upload Endpoint (POST /api/admin/uploads/product-image)
router.post("/uploads/product-image", (req, res) => {
  upload.single("image")(req, res, async (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File exceeds 5 MB size limit." });
      }
      return res.status(400).json({ error: err.message || "Failed to upload image." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided in upload request." });
    }

    // Check if Cloudinary credentials are configured for production storage
    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (hasCloudinary) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "fictionfigure/products",
          resource_type: "image",
        });

        // Clean up temporary local file after Cloudinary upload
        fs.unlink(req.file.path, () => {});

        return res.json({
          success: true,
          url: uploadResult.secure_url,
          filename: uploadResult.public_id,
        });
      } catch (cloudErr: any) {
        console.error("Cloudinary upload error:", cloudErr);
        if (req.file) fs.unlink(req.file.path, () => {});

        if (process.env.NODE_ENV === "production") {
          return res.status(500).json({
            error: cloudErr.message || "Failed to upload image to Cloudinary storage.",
          });
        }
      }
    } else if (process.env.NODE_ENV === "production") {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(500).json({
        error: "Cloudinary storage is not configured.",
      });
    }

    // Local development fallback storage
    let baseUrl = "";
    if (process.env.PUBLIC_API_URL && process.env.PUBLIC_API_URL.trim()) {
      baseUrl = process.env.PUBLIC_API_URL.trim().replace(/\/$/, "");
    } else {
      const host = req.get("host") || "localhost:5000";
      const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
      baseUrl = `${protocol}://${host}`;
    }
    const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
    });
  });
});

// Enforce Strict Admin Authentication & Authorization Across All Admin Console Endpoints
router.use(requireAdmin);

/**
 * GET /api/admin/media
 * Admin Media Library & Asset Usage Tracker
 */
router.get("/media", async (_req: any, res: any) => {
  try {
    const productImages = await prisma.productImage.findMany({
      select: {
        id: true,
        url: true,
        altText: true,
        createdAt: true,
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const categories = await prisma.category.findMany({
      where: { imageUrl: { not: null } },
      select: { id: true, name: true, slug: true, imageUrl: true },
    });

    const settings = await prisma.storeSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => (settingsMap[s.key] = s.value));

    const mediaMap = new Map<string, any>();

    // 1. Collect Product Images
    productImages.forEach((img) => {
      if (!img.url) return;
      const existing = mediaMap.get(img.url) || {
        url: img.url,
        createdAt: img.createdAt,
        usage: [],
      };
      existing.usage.push({
        type: "product",
        id: img.product.id,
        title: img.product.name,
        slug: img.product.slug,
      });
      mediaMap.set(img.url, existing);
    });

    // 2. Collect Category Images
    categories.forEach((cat) => {
      if (!cat.imageUrl) return;
      const existing = mediaMap.get(cat.imageUrl) || {
        url: cat.imageUrl,
        createdAt: new Date(),
        usage: [],
      };
      existing.usage.push({
        type: "category",
        id: cat.id,
        title: cat.name,
        slug: cat.slug,
      });
      mediaMap.set(cat.imageUrl, existing);
    });

    // 3. Scan Hero Carousel Slides
    if (settingsMap.homepage_carousel_slides_json) {
      try {
        const slides = JSON.parse(settingsMap.homepage_carousel_slides_json);
        if (Array.isArray(slides)) {
          slides.forEach((slide: any) => {
            if (slide.image) {
              const existing = mediaMap.get(slide.image) || {
                url: slide.image,
                createdAt: new Date(),
                usage: [],
              };
              existing.usage.push({
                type: "hero_slide",
                id: slide.id || "hero",
                title: slide.title || "Hero Slide",
              });
              mediaMap.set(slide.image, existing);
            }
          });
        }
      } catch (e) {}
    }

    // 4. Scan Main Hero Image
    if (settingsMap.homepage_hero_image_url) {
      const url = settingsMap.homepage_hero_image_url;
      const existing = mediaMap.get(url) || {
        url,
        createdAt: new Date(),
        usage: [],
      };
      existing.usage.push({
        type: "hero_main",
        title: "Main Hero Poster",
      });
      mediaMap.set(url, existing);
    }

    const items = Array.from(mediaMap.values());
    res.json({
      success: true,
      media: items,
      totalCount: items.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to load media assets." });
  }
});

// ==========================================
// 2. CATEGORIES MANAGEMENT (FULL CRUD)
// ==========================================

router.get("/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true } },
      },
    });
    res.json({ categories });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            images: { take: 1 },
            variants: { select: { inventoryCount: true } },
          },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json({ category });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch category detail" });
  }
});

router.post("/categories", requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");

    const existing = await prisma.category.findUnique({ where: { slug: generatedSlug } });
    if (existing) {
      return res.status(409).json({ error: "A category with this slug already exists" });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        description: description ? description.trim() : null,
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json({ success: true, category });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create category" });
  }
});

router.patch("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, imageUrl } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Category not found" });

    let updatedSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      updatedSlug = slug.toLowerCase().trim().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
      const duplicate = await prisma.category.findUnique({ where: { slug: updatedSlug } });
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({ error: "A category with this slug already exists" });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        slug: updatedSlug,
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    });

    res.json({ success: true, category: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update category" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { targetCategoryId, action } = req.query as any;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) return res.status(404).json({ error: "Category not found" });

    const productCount = category._count.products;

    if (productCount > 0) {
      if (targetCategoryId) {
        // Move products to another category
        await prisma.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: targetCategoryId },
        });
      } else if (action === "UNASSIGN") {
        // Fallback: move to any existing category
        const fallbackCat = await prisma.category.findFirst({
          where: { id: { not: id } },
        });

        if (!fallbackCat) {
          return res.status(400).json({
            error: "Cannot delete the only remaining category while it contains products. Create another category first.",
          });
        }

        await prisma.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: fallbackCat.id },
        });
      } else {
        return res.status(400).json({
          error: "CATEGORY_HAS_PRODUCTS",
          message: `This category contains ${productCount} product(s). Please reassign products before deleting.`,
          productCount,
        });
      }
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete category" });
  }
});

// Remove product from category (reassign to fallback)
router.delete("/categories/:id/products/:productId", async (req, res) => {
  try {
    const { id, productId } = req.params;
    const fallbackCat = await prisma.category.findFirst({
      where: { id: { not: id } },
    });

    if (!fallbackCat) {
      return res.status(400).json({ error: "Cannot remove product as no alternative category exists." });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { categoryId: fallbackCat.id },
    });

    res.json({ success: true, message: "Product removed from category" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to remove product from category" });
  }
});

// ==========================================
// 3. PRODUCTS MANAGEMENT & CRUD
// ==========================================

router.get("/products", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: { select: { id: true, sku: true, price: true, inventoryCount: true } },
      },
    });
    res.json({ products });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const {
      name,
      slug,
      brand,
      shortDescription,
      description,
      price,
      compareAtPrice,
      sku,
      categoryId,
      status,
      featured,
      material,
      scale,
      franchise,
      whatsIncluded,
      images,
      stockQuantity,
      isClothing,
      sizeVariants,
    } = req.body;

    if (!name || !price || !sku) {
      return res.status(400).json({ error: "Product name, price, and SKU are required" });
    }

    const generatedSlug = (slug || name).toLowerCase().trim().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
    const stock = typeof stockQuantity === "number" ? stockQuantity : Number(stockQuantity) || 0;
    const imgArray = Array.isArray(images) && images.length > 0 ? images.filter(Boolean) : [];
    const isClothingProduct = Boolean(isClothing);

    let cat = categoryId;
    if (!cat) {
      const firstCat = await prisma.category.findFirst();
      cat = firstCat?.id;
    }

    if (!cat) {
      return res.status(400).json({ error: "A category selection is required to publish a product." });
    }

    let variantsToCreate: any[] = [];

    if (isClothingProduct && Array.isArray(sizeVariants) && sizeVariants.length > 0) {
      variantsToCreate = sizeVariants.map((sv: any) => {
        const sizeTitle = String(sv.size || sv.title).trim();
        const sizeStock = Math.max(0, Number(sv.stock !== undefined ? sv.stock : sv.inventoryCount) || 0);
        return {
          title: sizeTitle,
          sku: `${sku}-${sizeTitle.toUpperCase()}`,
          price: Number(price),
          inventoryCount: sizeStock,
          imageUrl: imgArray[0] || null,
          options: {
            create: [{ name: "Size", value: sizeTitle }],
          },
          inventory: {
            create: {
              quantity: sizeStock,
              reservedQuantity: 0,
              lowStockThreshold: 3,
            },
          },
        };
      });
    } else {
      variantsToCreate = [
        {
          title: "Standard Edition",
          sku: `${sku}-STD`,
          price: Number(price),
          inventoryCount: stock,
          imageUrl: imgArray[0] || null,
          inventory: {
            create: {
              quantity: stock,
              reservedQuantity: 0,
              lowStockThreshold: 3,
            },
          },
        },
      ];
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: generatedSlug,
        brand: brand || "",
        shortDescription: shortDescription || name,
        description: description || name,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        sku,
        categoryId: cat,
        status: status || "ACTIVE",
        featured: Boolean(featured),
        material: material || null,
        scale: scale || null,
        franchise: franchise || null,
        whatsIncluded: whatsIncluded || null,
        isClothing: isClothingProduct,
        images: {
          create: imgArray.map((url: string, idx: number) => ({
            url,
            altText: `${name} View ${idx + 1}`,
            sortOrder: idx,
            isPrimary: idx === 0,
          })),
        },
        variants: {
          create: variantsToCreate,
        },
      },
      include: {
        images: true,
        variants: {
          include: { inventory: true, options: true },
        },
      },
    });

    res.status(201).json({ success: true, product });
  } catch (err: any) {
    console.error("POST /api/admin/products error:", err);
    if (err.code === "P2002") {
      const targetStr = Array.isArray(err.meta?.target)
        ? err.meta.target.join(", ")
        : String(err.meta?.target || "");

      if (targetStr.includes("slug")) {
        return res.status(409).json({
          error: "A product with this URL slug already exists.",
          field: "slug",
        });
      }

      if (targetStr.includes("sku")) {
        return res.status(409).json({
          error: "A product with this SKU code already exists.",
          field: "sku",
        });
      }

      return res.status(409).json({
        error: "A product with this URL slug already exists.",
        field: "slug",
      });
    }

    res.status(500).json({ error: err.message || "Failed to create product" });
  }
});

router.patch("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      brand,
      categoryId,
      status,
      price,
      compareAtPrice,
      shortDescription,
      description,
      material,
      scale,
      franchise,
      whatsIncluded,
      stockQuantity,
      images,
      isClothing,
      sizeVariants,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: { include: { inventory: true } } },
    });

    if (!existingProduct) return res.status(404).json({ error: "Product not found" });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(brand !== undefined && { brand }),
        ...(categoryId && { categoryId }),
        ...(status && { status }),
        ...(price !== undefined && { price: Number(price) }),
        ...(compareAtPrice !== undefined && { compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(description !== undefined && { description }),
        ...(material !== undefined && { material: material || null }),
        ...(scale !== undefined && { scale: scale || null }),
        ...(franchise !== undefined && { franchise: franchise || null }),
        ...(whatsIncluded !== undefined && { whatsIncluded: whatsIncluded || null }),
        ...(isClothing !== undefined && { isClothing: Boolean(isClothing) }),
      },
    });

    const isClothingProduct = isClothing !== undefined ? Boolean(isClothing) : existingProduct.isClothing;

    if (isClothingProduct && Array.isArray(sizeVariants)) {
      const activeSizeTitles = new Set<string>();

      for (const sv of sizeVariants) {
        const sizeTitle = String(sv.size || sv.title).trim();
        if (!sizeTitle) continue;
        activeSizeTitles.add(sizeTitle);

        const sizeStock = Math.max(0, Number(sv.stock !== undefined ? sv.stock : sv.inventoryCount) || 0);
        const existingVariant = existingProduct.variants.find((v) => v.title === sizeTitle);

        if (existingVariant) {
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              inventoryCount: sizeStock,
              ...(price !== undefined && { price: Number(price) }),
            },
          });
          if (existingVariant.inventory) {
            await prisma.inventory.update({
              where: { variantId: existingVariant.id },
              data: { quantity: sizeStock },
            });
          } else {
            await prisma.inventory.create({
              data: {
                variantId: existingVariant.id,
                quantity: sizeStock,
                reservedQuantity: 0,
                lowStockThreshold: 3,
              },
            });
          }
        } else {
          await prisma.productVariant.create({
            data: {
              productId: id,
              title: sizeTitle,
              sku: `${existingProduct.sku}-${sizeTitle.toUpperCase()}`,
              price: Number(price !== undefined ? price : existingProduct.price),
              inventoryCount: sizeStock,
              options: {
                create: [{ name: "Size", value: sizeTitle }],
              },
              inventory: {
                create: {
                  quantity: sizeStock,
                  reservedQuantity: 0,
                  lowStockThreshold: 3,
                },
              },
            },
          });
        }
      }

      // Set stock to 0 for any size variants that were omitted/disabled by admin
      for (const v of existingProduct.variants) {
        if (v.title !== "Standard Edition" && !activeSizeTitles.has(v.title)) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: { inventoryCount: 0 },
          });
          if (v.inventory) {
            await prisma.inventory.update({
              where: { variantId: v.id },
              data: { quantity: 0 },
            });
          }
        }
      }
    } else if (stockQuantity !== undefined && existingProduct.variants[0]) {
      await prisma.productVariant.update({
        where: { id: existingProduct.variants[0].id },
        data: { inventoryCount: Number(stockQuantity) },
      });
      if (existingProduct.variants[0].inventory) {
        await prisma.inventory.update({
          where: { variantId: existingProduct.variants[0].id },
          data: { quantity: Number(stockQuantity) },
        });
      }
    }

    if (Array.isArray(images)) {
      const validImages = images.filter(Boolean);
      await prisma.productImage.deleteMany({ where: { productId: id } });
      if (validImages.length > 0) {
        await prisma.productImage.createMany({
          data: validImages.map((url: string, idx: number) => ({
            productId: id,
            url,
            altText: `${name || existingProduct.name} View ${idx + 1}`,
            sortOrder: idx,
            isPrimary: idx === 0,
          })),
        });
      }
    }

    res.json({ success: true, product: updatedProduct });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update product" });
  }
});

// Duplicate product
router.post("/products/:id/duplicate", async (req, res) => {
  try {
    const { id } = req.params;
    const orig = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true },
    });

    if (!orig) return res.status(404).json({ error: "Original product not found" });

    const newSlug = `${orig.slug}-copy-${Math.floor(100 + Math.random() * 900)}`;
    const newSku = `FF-COPY-${Math.floor(1000 + Math.random() * 9000)}`;

    const copy = await prisma.product.create({
      data: {
        name: `${orig.name} (Copy)`,
        slug: newSlug,
        brand: orig.brand,
        shortDescription: orig.shortDescription,
        description: orig.description,
        price: orig.price,
        compareAtPrice: orig.compareAtPrice,
        sku: newSku,
        categoryId: orig.categoryId,
        status: "DRAFT",
        featured: false,
        material: orig.material,
        scale: orig.scale,
        franchise: orig.franchise,
        images: {
          create: orig.images.map((img, idx) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: idx,
            isPrimary: idx === 0,
          })),
        },
        variants: {
          create: [
            {
              title: "Standard Edition",
              sku: `${newSku}-STD`,
              price: orig.price,
              inventoryCount: orig.variants[0]?.inventoryCount || 0,
              imageUrl: orig.images[0]?.url || null,
              inventory: {
                create: {
                  quantity: orig.variants[0]?.inventoryCount || 0,
                  reservedQuantity: 0,
                  lowStockThreshold: 3,
                },
              },
            },
          ],
        },
      },
      include: { images: true, variants: true },
    });

    res.status(201).json({ success: true, product: copy });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to duplicate product" });
  }
});

// Archive or delete product safely
router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if this product is currently set as featured product
    const heroSetting = await prisma.storeSetting.findUnique({
      where: { key: "homepage_hero_featured_product_id" },
    });
    if (heroSetting && heroSetting.value === id) {
      await prisma.storeSetting.update({
        where: { key: "homepage_hero_featured_product_id" },
        data: { value: "" },
      }).catch(() => {});
      const { clearSettingsCache } = require("./settings.js");
      if (typeof clearSettingsCache === "function") clearSettingsCache();
    }

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

    if (orderItemCount > 0) {
      // Archive if product has sales history
      await prisma.product.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });
      return res.json({
        success: true,
        archived: true,
        message: "Product has sales history. Status changed to ARCHIVED.",
      });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ==========================================
// 4. DISCOUNTS & COUPONS (FULL CRUD)
// ==========================================

router.get("/coupons", async (_req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    });
    res.json({ coupons });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});

router.post("/coupons", async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      maxUsage,
      perCustomerLimit,
      startDate,
      endDate,
      isActive,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ error: "Coupon code, discount type, and value are required" });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return res.status(409).json({ error: "A coupon code with this code already exists" });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType.toUpperCase(), // PERCENTAGE, FIXED
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        maxUsage: Number(maxUsage) || 100,
        perCustomerLimit: Number(perCustomerLimit) || 1,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json({ success: true, coupon });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create coupon" });
  }
});

router.patch("/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      maxUsage,
      perCustomerLimit,
      startDate,
      endDate,
      isActive,
    } = req.body;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Coupon not found" });

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase().trim() }),
        ...(discountType && { discountType: discountType.toUpperCase() }),
        ...(discountValue !== undefined && { discountValue: Number(discountValue) }),
        ...(minOrderValue !== undefined && { minOrderValue: Number(minOrderValue) }),
        ...(maxDiscountAmount !== undefined && { maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null }),
        ...(maxUsage !== undefined && { maxUsage: Number(maxUsage) }),
        ...(perCustomerLimit !== undefined && { perCustomerLimit: Number(perCustomerLimit) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : new Date() }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    res.json({ success: true, coupon: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update coupon" });
  }
});

router.delete("/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete coupon" });
  }
});

// ==========================================
// 5. INVENTORY OPERATIONS
// ==========================================

router.get("/inventory", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        category: { select: { name: true } },
        variants: {
          include: {
            inventory: {
              include: {
                transactions: { orderBy: { createdAt: "desc" }, take: 3 },
              },
            },
          },
        },
      },
    });

    const inventoryList = products.flatMap((p) =>
      p.variants.map((v) => {
        const qty = v.inventoryCount;
        let stockStatus = "IN_STOCK";
        if (qty === 0) stockStatus = "OUT_OF_STOCK";
        else if (qty <= (v.inventory?.lowStockThreshold || 3)) stockStatus = "LOW_STOCK";

        return {
          productId: p.id,
          productName: p.name,
          variantId: v.id,
          sku: v.sku,
          categoryName: p.category.name,
          currentStock: qty,
          stockStatus,
          lowStockThreshold: v.inventory?.lowStockThreshold || 3,
          recentTransactions: v.inventory?.transactions || [],
        };
      })
    );

    res.json({ inventory: inventoryList });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

router.patch("/inventory", async (req, res) => {
  try {
    const { variantId, stockQuantity, changeQuantity, reason } = req.body;

    if (!variantId) {
      return res.status(400).json({ error: "Variant ID is required" });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });

    if (!variant) return res.status(404).json({ error: "Variant not found" });

    const prevQty = variant.inventoryCount;
    let newQty = prevQty;

    if (typeof stockQuantity === "number") {
      newQty = Math.max(0, stockQuantity);
    } else if (typeof changeQuantity === "number") {
      newQty = Math.max(0, prevQty + changeQuantity);
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { inventoryCount: newQty },
    });

    // Record Inventory Transaction
    if (variant.inventory) {
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: variant.inventory.id,
          type: newQty >= prevQty ? "RESTOCK" : "ADJUSTMENT",
          changeQuantity: newQty - prevQty,
          previousQuantity: prevQty,
          newQuantity: newQty,
          reason: reason || "Manual stock adjustment via Admin Console",
        },
      });

      await prisma.inventory.update({
        where: { id: variant.inventory.id },
        data: { quantity: newQty },
      });
    }

    res.json({ success: true, variant: updatedVariant, newQuantity: newQty });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update inventory" });
  }
});

// ==========================================
// 6. CUSTOMER DIRECTORY & DETAIL
// ==========================================
// CANCELLED ORDER REVENUE EXCLUSION CONSTANTS & HELPERS
// ==========================================
export const CANCELLED_ORDER_STATUS = "CANCELLED";
export const REVENUE_ELIGIBLE_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

export function isRevenueEligibleOrder(status: string): boolean {
  const s = String(status || "").toUpperCase().trim();
  return s !== CANCELLED_ORDER_STATUS && REVENUE_ELIGIBLE_STATUSES.includes(s);
}

export const REVENUE_ELIGIBLE_ORDER_WHERE = {
  status: { notIn: [CANCELLED_ORDER_STATUS] },
};

router.get("/customers", async (_req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: { totalAmount: true, createdAt: true, status: true },
        },
        _count: { select: { orders: true } },
      },
    });

    const formatted = customers.map((c) => {
      const validOrders = c.orders.filter((o) => isRevenueEligibleOrder(o.status));
      const totalSpent = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const lastOrder = c.orders[0]?.createdAt || null;

      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`.trim(),
        phone: c.phone,
        email: c.email,
        phoneVerified: c.phoneVerified,
        isBlocked: c.isBlocked,
        orderCount: c._count.orders,
        totalSpent,
        createdAt: c.createdAt,
        lastOrderDate: lastOrder,
      };
    });

    res.json({ customers: formatted });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch customer directory" });
  }
});

router.get("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const totalSpent = customer.orders
      .filter((o) => isRevenueEligibleOrder(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({ customer, totalSpent });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch customer detail" });
  }
});

// ==========================================
// 7. ORDERS MANAGEMENT & TIMELINE
// ==========================================

router.get("/orders", async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: true,
      },
    });

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      totalAmount: o.totalAmount,
      customerName: o.user ? `${o.user.firstName} ${o.user.lastName}`.trim() : "Guest Collector",
      customerEmail: o.user?.email || o.user?.phone || "N/A",
      itemsCount: o.items.length,
      items: o.items,
    }));

    res.json({ orders: formattedOrders });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { sortOrder: "asc" }, take: 1 },
                    category: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
        coupon: true,
      },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    let userDetails = null;
    if (order.userId) {
      userDetails = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      });
    }

    let parsedShippingAddress = null;
    try {
      if (order.shippingAddressJson) {
        const raw = order.shippingAddressJson;
        parsedShippingAddress = typeof raw === "string" ? JSON.parse(raw) : raw;
      }
    } catch (e) {}

    const formattedItems = order.items.map((item) => {
      const variantTitle = item.variant && item.variant.title !== "Default Title" ? item.variant.title : null;
      const productName = item.variant?.product?.name || item.title;
      const categoryName = item.variant?.product?.category?.name || null;
      const image = item.variant?.imageUrl || item.variant?.product?.images?.[0]?.url || "";

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
        productName,
        variantTitle,
        categoryName,
        image,
      };
    });

    res.json({
      order: {
        ...order,
        shippingAddress: parsedShippingAddress,
        user: userDetails,
        formattedItems,
      },
    });
  } catch (err: any) {
    console.error("GET orders/:id error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch order details" });
  }
});

router.patch("/orders", async (req, res) => {
  try {
    const { orderId, id, status } = req.body;
    const targetId = orderId || id;

    if (!targetId || !status) {
      return res.status(400).json({ error: "Order ID and new status are required" });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: targetId },
      include: { items: true },
    });

    if (!existingOrder) return res.status(404).json({ error: "Order not found" });

    // Handle inventory restoration upon order cancellation
    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
      for (const item of existingOrder.items) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { inventoryCount: { increment: item.quantity } },
        });
      }
    }

    const updated = await prisma.order.update({
      where: { id: targetId },
      data: { status },
    });

    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update order status" });
  }
});

// Admin Manual Payment Verification (UTR / COD)
router.patch("/orders/:id/verify-payment", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { payments: true, items: true, coupon: true },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const payment = order.payments[0];

    // Idempotency check: If payment is already marked PAID, return success cleanly
    if (payment && payment.status === "PAID" && order.status === "PROCESSING") {
      return res.json({ success: true, message: "Payment already verified", order });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Payment Status to PAID
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "PAID" },
        });
      }

      // 2. Update Order Status to PROCESSING
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PROCESSING" },
      });

      // 3. Decrement Inventory Atomic Update
      for (const item of order.items) {
        const inventory = await tx.inventory.findUnique({
          where: { variantId: item.variantId },
        });

        if (inventory) {
          const prevQty = inventory.quantity;
          const newQty = Math.max(0, prevQty - item.quantity);

          await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: newQty },
          });

          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: "ORDER_DEDUCTION",
              changeQuantity: -item.quantity,
              previousQuantity: prevQty,
              newQuantity: newQty,
              reason: `Admin Verified Order ${order.orderNumber}`,
            },
          });
        }

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { inventoryCount: { decrement: item.quantity } },
        });
      }

      // 4. Increment Coupon usage if applicable
      if (order.couponId) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { payments: true, items: true },
    });

    res.json({ success: true, message: "Payment verified successfully.", order: updatedOrder });
  } catch (err: any) {
    console.error("verify-payment error:", err);
    res.status(500).json({ error: err.message || "Failed to verify payment" });
  }
});

// Admin Manual Payment Rejection
router.patch("/orders/:id/reject-payment", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { payments: true },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const payment = order.payments[0];

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    res.json({ success: true, message: "Payment rejected and order cancelled.", order: updatedOrder });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to reject payment" });
  }
});

// ==========================================
// 8. DYNAMIC REAL ANALYTICS ENGINE
// ==========================================

router.get("/analytics", async (req, res) => {
  try {
    const period = (req.query.period as string) || "all";
    let dateFilter: any = {};

    const now = new Date();
    if (period === "today") {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { gte: startOfDay };
    } else if (period === "yesterday") {
      const start = new Date(now.setDate(now.getDate() - 1));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (period === "7d") {
      dateFilter = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === "30d") {
      dateFilter = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (period === "90d") {
      dateFilter = { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    } else if (period === "this_year") {
      dateFilter = { gte: new Date(new Date().getFullYear(), 0, 1) };
    }

    const whereOrderDate = dateFilter.gte ? { createdAt: dateFilter } : {};

    const orders = await prisma.order.findMany({
      where: whereOrderDate,
      include: { items: { include: { variant: { include: { product: { include: { category: true } } } } } } },
    });

    const validOrders = orders.filter((o) => isRevenueEligibleOrder(o.status));
    const cancelledOrders = orders.filter((o) => o.status === CANCELLED_ORDER_STATUS).length;
    const pendingOrders = orders.filter((o) => o.status === "PENDING").length;

    const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = validOrders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const productsSold = validOrders.reduce(
      (sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const newCustomers = await prisma.user.count({
      where: { role: "CUSTOMER", ...(dateFilter.gte && { createdAt: dateFilter }) },
    });

    // Low stock & out of stock products
    const inventories = await prisma.inventory.findMany();
    const lowStockProducts = inventories.filter((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length;
    const outOfStockProducts = inventories.filter((i) => i.quantity === 0).length;

    // Coupon usage
    const couponAgg = await prisma.coupon.aggregate({ _sum: { usedCount: true } });
    const couponUsage = couponAgg._sum.usedCount || 0;

    // Revenue Timeline for Chart (Calculated EXCLUSIVELY from validOrders)
    const revenueTimelineMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    for (const o of validOrders) {
      const dayKey = new Date(o.createdAt).toISOString().split("T")[0];
      if (!revenueTimelineMap[dayKey]) {
        revenueTimelineMap[dayKey] = { date: dayKey, revenue: 0, orders: 0 };
      }
      revenueTimelineMap[dayKey].revenue += o.totalAmount;
      revenueTimelineMap[dayKey].orders += 1;
    }

    const revenueTimeline = Object.values(revenueTimelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Top Selling Products (Calculated EXCLUSIVELY from validOrders)
    const productSalesMap: Record<string, { id: string; name: string; units: number; revenue: number }> = {};
    for (const o of validOrders) {
      for (const item of o.items) {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { id: item.productId, name: item.title, units: 0, revenue: 0 };
        }
        productSalesMap[item.productId].units += item.quantity;
        productSalesMap[item.productId].revenue += item.total;
      }
    }

    const topSellingProducts = Object.values(productSalesMap).sort((a, b) => b.units - a.units).slice(0, 5);

    // Category Performance (Calculated EXCLUSIVELY from validOrders)
    const categoryMap: Record<string, { name: string; units: number; revenue: number }> = {};
    for (const o of validOrders) {
      for (const item of o.items) {
        const catName = item.variant?.product?.category?.name || "Uncategorized";
        if (!categoryMap[catName]) {
          categoryMap[catName] = { name: catName, units: 0, revenue: 0 };
        }
        categoryMap[catName].units += item.quantity;
        categoryMap[catName].revenue += item.total;
      }
    }

    const categoryPerformance = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

    res.json({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalCustomers,
      newCustomers,
      repeatPurchaseRate: totalCustomers > 0 ? Math.round((newCustomers / totalCustomers) * 100) : 0,
      productsSold,
      cancelledOrders,
      pendingOrders,
      lowStockProducts,
      outOfStockProducts,
      couponUsage,
      revenueTimeline,
      topSellingProducts,
      categoryPerformance,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to calculate analytics" });
  }
});

// Executive Summary / Dashboard Stats
router.get("/stats", async (_req, res) => {
  try {
    const totalOrders = await prisma.order.count({
      where: REVENUE_ELIGIBLE_ORDER_WHERE,
    });
    const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });
    const totalProducts = await prisma.product.count({ where: { status: "ACTIVE" } });

    const revenueAgg = await prisma.order.aggregate({
      where: REVENUE_ELIGIBLE_ORDER_WHERE,
      _sum: { totalAmount: true },
    });
    const totalRevenue = revenueAgg._sum.totalAmount || 0;

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });

    res.json({
      totalRevenue,
      totalOrders,
      pendingOrders,
      totalProducts,
      recentOrders,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to calculate store statistics" });
  }
});

// ==========================================
// 9. DATABASE-BACKED STORE SETTINGS & HOMEPAGE HERO CMS
// ==========================================

const HERO_KEYS = [
  "homepage_hero_enabled",
  "homepage_hero_image_url",
  "homepage_hero_eyebrow",
  "homepage_hero_title",
  "homepage_hero_title_accent",
  "homepage_hero_description",
  "homepage_hero_primary_label",
  "homepage_hero_primary_url",
  "homepage_hero_secondary_label",
  "homepage_hero_secondary_url",
  "homepage_hero_featured_product_id",
];

router.get("/settings", async (_req, res) => {
  try {
    const settingsList = await prisma.storeSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settingsList) {
      settingsMap[s.key] = s.value;
    }

    // Fetch product list for dropdown selectors
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        images: { select: { url: true }, take: 1 },
      },
      orderBy: { name: "asc" },
    });

    // Auto-clean stale featured product reference if product no longer exists in DB
    if (settingsMap.homepage_hero_featured_product_id) {
      const exists = products.some((p) => p.id === settingsMap.homepage_hero_featured_product_id);
      if (!exists) {
        settingsMap.homepage_hero_featured_product_id = "";
        await prisma.storeSetting.upsert({
          where: { key: "homepage_hero_featured_product_id" },
          update: { value: "" },
          create: { key: "homepage_hero_featured_product_id", value: "" },
        }).catch(() => {});
      }
    }

    res.json({ settings: settingsMap, products });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch store settings" });
  }
});

router.post("/settings", async (req, res) => {
  try {
    const { section, settings } = req.body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "Settings object is required" });
    }

    // Gracefully handle Featured Product ID if provided
    if (settings.homepage_hero_featured_product_id && String(settings.homepage_hero_featured_product_id).trim()) {
      const featId = String(settings.homepage_hero_featured_product_id).trim();
      const prod = await prisma.product.findUnique({
        where: { id: featId },
      });
      if (!prod || prod.status !== "ACTIVE") {
        // Automatically clear stale or deleted product reference instead of failing with HTTP 400
        settings.homepage_hero_featured_product_id = "";
      }
    }

    // Validate Server-Side Ranges
    if (settings.gstTaxRate !== undefined) {
      const gst = Number(settings.gstTaxRate);
      if (isNaN(gst) || gst < 0 || gst > 100) {
        return res.status(400).json({ error: "GST Tax Rate must be a number between 0% and 100%." });
      }
    }

    // Save to Database
    for (const [key, value] of Object.entries(settings)) {
      await prisma.storeSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    res.json({ success: true, section, message: "Settings saved successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Unable to save settings." });
  }
});

// Dedicated Homepage Hero GET & PUT Endpoints
router.get("/settings/homepage-hero", async (_req, res) => {
  try {
    const settingsList = await prisma.storeSetting.findMany({
      where: { key: { in: HERO_KEYS } },
    });

    const heroConfig: Record<string, string> = {};
    for (const s of settingsList) {
      heroConfig[s.key] = s.value;
    }

    let featuredProduct = null;
    if (heroConfig.homepage_hero_featured_product_id) {
      const prod = await prisma.product.findUnique({
        where: { id: heroConfig.homepage_hero_featured_product_id },
        include: { images: true },
      });
      if (prod && prod.status === "ACTIVE") {
        featuredProduct = {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          sku: prod.sku,
          imageUrl: prod.images[0]?.url || "",
        };
      } else {
        heroConfig.homepage_hero_featured_product_id = "";
        await prisma.storeSetting.upsert({
          where: { key: "homepage_hero_featured_product_id" },
          update: { value: "" },
          create: { key: "homepage_hero_featured_product_id", value: "" },
        }).catch(() => {});
      }
    }

    res.json({ heroConfig, featuredProduct });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch homepage hero configuration" });
  }
});

router.put("/settings/homepage-hero", async (req, res) => {
  try {
    const heroSettings = req.body;
    if (!heroSettings || typeof heroSettings !== "object") {
      return res.status(400).json({ error: "Homepage hero settings object required." });
    }

    const {
      homepage_hero_enabled,
      homepage_hero_image_url,
      homepage_hero_eyebrow,
      homepage_hero_title,
      homepage_hero_title_accent,
      homepage_hero_description,
      homepage_hero_primary_label,
      homepage_hero_primary_url,
      homepage_hero_secondary_label,
      homepage_hero_secondary_url,
      homepage_hero_featured_product_id,
    } = heroSettings;

    // Validate Hero Image URL
    if (homepage_hero_image_url && !/^https?:\/\/.+/i.test(homepage_hero_image_url)) {
      return res.status(400).json({ error: "Hero Image URL must be a valid HTTP/HTTPS URL." });
    }

    // Gracefully handle Featured Product ID if specified
    if (homepage_hero_featured_product_id && String(homepage_hero_featured_product_id).trim()) {
      const featId = String(homepage_hero_featured_product_id).trim();
      const existingProd = await prisma.product.findUnique({
        where: { id: featId },
      });
      if (!existingProd || existingProd.status !== "ACTIVE") {
        heroSettings.homepage_hero_featured_product_id = "";
      }
    }

    // Validate URLs
    if (homepage_hero_primary_url && typeof homepage_hero_primary_url !== "string") {
      return res.status(400).json({ error: "Primary Button URL must be a valid string." });
    }
    if (homepage_hero_secondary_url && typeof homepage_hero_secondary_url !== "string") {
      return res.status(400).json({ error: "Secondary Button URL must be a valid string." });
    }

    // Save all hero keys to database
    for (const [key, value] of Object.entries(heroSettings)) {
      if (HERO_KEYS.includes(key)) {
        await prisma.storeSetting.upsert({
          where: { key },
          update: { value: String(value ?? "") },
          create: { key, value: String(value ?? "") },
        });
      }
    }

    res.json({ success: true, message: "Homepage hero updated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update homepage hero settings." });
  }
});

// ==========================================
// ADMIN CUSTOMER MANAGEMENT ENDPOINTS
// ==========================================

// 1. Get All Customers Directory (GET /api/admin/customers)
router.get("/customers", requireAdmin, async (_req: any, res: any) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    const mappedCustomers = customers.map((c: any) => {
      const validOrders = (c.orders || []).filter((o: any) => o.status !== "CANCELLED");
      const totalSpent = validOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      return {
        id: c.id,
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Anonymous Collector",
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        phoneVerified: c.phoneVerified,
        isVerified: c.isVerified,
        isBlocked: c.isBlocked,
        createdAt: c.createdAt,
        orderCount: c.orders?.length || 0,
        totalSpent,
      };
    });

    res.json({ success: true, customers: mappedCustomers });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch customer directory." });
  }
});

// 2. Get Single Customer Profile (GET /api/admin/customers/:id)
router.get("/customers/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            payments: {
              take: 1,
              select: {
                paymentMethod: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found." });
    }

    const validOrders = (customer.orders || []).filter((o: any) => o.status !== "CANCELLED");
    const totalSpent = validOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

    const formattedOrders = (customer.orders || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      status: o.status,
      paymentMethod: o.payments?.[0]?.paymentMethod || "N/A",
      paymentStatus: o.payments?.[0]?.status || "PENDING",
      createdAt: o.createdAt,
    }));

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Anonymous Collector",
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        phoneVerified: customer.phoneVerified,
        isVerified: customer.isVerified,
        isBlocked: customer.isBlocked,
        role: customer.role,
        createdAt: customer.createdAt,
        addresses: customer.addresses,
        orders: formattedOrders,
        orderCount: customer.orders.length,
        totalSpent,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch customer profile details." });
  }
});

// 3. Block / Unblock Customer Endpoint (PATCH /api/admin/users/:id/block and alias PATCH /api/admin/users/block)
const handleBlockCustomer = async (req: any, res: any) => {
  try {
    const targetId = req.params.id || req.body.userId;
    if (!targetId) {
      return res.status(400).json({ success: false, error: "Customer ID is required." });
    }

    const shouldBlock =
      typeof req.body.blocked === "boolean"
        ? req.body.blocked
        : typeof req.body.isBlocked === "boolean"
        ? req.body.isBlocked
        : true;

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: "User account not found." });
    }

    // Prevent self-blocking by admin
    if (targetUser.id === req.user?.id) {
      return res.status(400).json({ success: false, error: "Cannot block your own admin account." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { isBlocked: shouldBlock },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isBlocked: true,
        role: true,
      },
    });

    res.json({
      success: true,
      message: `Customer account status updated to ${updatedUser.isBlocked ? "BLOCKED" : "ACTIVE"}.`,
      user: updatedUser,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to update block status." });
  }
};

router.patch("/users/:id/block", requireAdmin, handleBlockCustomer);
router.patch("/users/block", requireAdmin, handleBlockCustomer);

// 4. Delete Customer Account Endpoint (DELETE /api/admin/users/:id)
router.delete("/users/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const targetId = req.params.id;
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: "User account not found." });
    }

    if (targetUser.id === req.user?.id) {
      return res.status(400).json({ success: false, error: "Cannot delete your own admin account." });
    }

    // Inspect historical orders
    const orderCount = await prisma.order.count({ where: { userId: targetId } });

    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        error: "This customer has existing orders and cannot be permanently deleted. You can block the account instead to disable access while keeping historical order history intact.",
      });
    }

    // Safe deletion of related records without orders
    await prisma.address.deleteMany({ where: { userId: targetId } });
    await prisma.wishlist.deleteMany({ where: { userId: targetId } });
    await prisma.cart.deleteMany({ where: { userId: targetId } });
    await prisma.user.delete({ where: { id: targetId } });

    res.json({
      success: true,
      message: "Customer account deleted successfully.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to delete customer account." });
  }
});

/**
 * GET /api/admin/settings
 * Admin Store Settings Retrieval
 */
router.get("/settings", requireAdmin, async (_req: any, res: any) => {
  try {
    const dbSettings = await prisma.storeSetting.findMany();
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };

    dbSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      settings: settingsMap,
      products,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to load store settings." });
  }
});

/**
 * POST /api/admin/settings
 * Admin Store Settings Bulk Update
 */
router.post("/settings", requireAdmin, async (req: any, res: any) => {
  try {
    const { section, settings: newSettings } = req.body;

    if (!newSettings || typeof newSettings !== "object") {
      return res.status(400).json({ success: false, error: "Settings payload object required." });
    }

    const upsertPromises = Object.entries(newSettings).map(([key, val]) => {
      const stringVal = String(val ?? "");
      return prisma.storeSetting.upsert({
        where: { key },
        update: { value: stringVal },
        create: { key, value: stringVal },
      });
    });

    await Promise.all(upsertPromises);
    clearSettingsCache();

    res.json({
      success: true,
      message: `${section || "Settings"} updated successfully.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to save store settings." });
  }
});

import { handleGetAdminReviews } from "./reviews.js";

/**
 * GET /api/admin/reviews
 * Admin endpoint to list all customer reviews across the store.
 */
router.get("/reviews", requireAdmin, handleGetAdminReviews);

export default router;
