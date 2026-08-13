import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

export const DEFAULT_SETTINGS: Record<string, string> = {
  hero_announcement: "⚡ COMPLIMENTARY EXPRESS SHIPPING ON ORDERS OVER ₹15,000 | AUTHENTIC IMPORTS DIRECT FROM TOKYO",
  hero_title: "Figures worth collecting.",
  hero_subtitle: "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.",
  store_contact_email: "support@fictionfigure.com",
  store_contact_phone: "+91 97974 94639",
  free_shipping_min: "15000",
  tax_rate_percentage: "18",
  return_policy_days: "14",
  upi_id: process.env.UPI_ID || "fictionfigure@upi",
  upi_qr_url: process.env.UPI_QR_URL || "https://res.cloudinary.com/demo/image/upload/v1/upi-qr-sample.png",

  // Homepage Hero CMS Settings
  homepage_hero_enabled: "true",
  homepage_hero_image_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
  homepage_hero_eyebrow: "CURATED COLLECTOR GALLERY",
  homepage_hero_title: "Figures worth collecting.",
  homepage_hero_title_accent: "Stories worth keeping.",
  homepage_hero_description: "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.",
  homepage_hero_primary_label: "SHOP COLLECTION",
  homepage_hero_primary_url: "/shop",
  homepage_hero_secondary_label: "EXPLORE NEW ARRIVALS",
  homepage_hero_secondary_url: "/shop?sortBy=newest",
  homepage_hero_featured_product_id: "",
};

// 1. Fetch All Dynamic Store Settings & Featured Product Info
router.get("/", async (_req, res) => {
  try {
    const dbSettings = await prisma.storeSetting.findMany();
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };

    dbSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    let featuredProduct = null;
    if (settingsMap.homepage_hero_featured_product_id) {
      const prod = await prisma.product.findUnique({
        where: { id: settingsMap.homepage_hero_featured_product_id },
        include: { images: true },
      });
      if (prod) {
        featuredProduct = {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          sku: prod.sku,
          imageUrl: prod.images[0]?.url || "",
        };
      }
    }

    res.json({ settings: settingsMap, featuredProduct });
  } catch (err: any) {
    res.json({ settings: DEFAULT_SETTINGS, featuredProduct: null });
  }
});

// 2. Update Dynamic Store Setting (Single Key-Value)
router.patch("/", async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || typeof value !== "string") {
      return res.status(400).json({ error: "Setting key and string value required" });
    }

    const updated = await prisma.storeSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.json({ success: true, setting: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update store setting" });
  }
});

export default router;
