import { MetadataRoute } from "next";
import { getProducts } from "@/lib/services/productService";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.fictionfigures.in";

  // Static public indexable pages (Strictly public routes only)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamically fetch public products with graceful fallback, deduplication & null safety
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const result = await getProducts({ limit: 100, inStockOnly: false });
    const products = result?.products;

    if (Array.isArray(products)) {
      const seenSlugs = new Set<string>();

      for (const p of products) {
        // Defensive check: null/undefined guard, active status check, slug/id requirement
        if (!p || typeof p !== "object") continue;
        if (p.isActive === false) continue;

        const slugOrId = (p.slug || p.id || "").toString().trim();
        if (!slugOrId) continue;

        const dedupeKey = slugOrId.toLowerCase();
        if (seenSlugs.has(dedupeKey)) continue;
        seenSlugs.add(dedupeKey);

        // Safe lastModified date parsing
        let lastModDate = new Date();
        if (p.updatedAt) {
          const parsed = new Date(p.updatedAt);
          if (!isNaN(parsed.getTime())) {
            lastModDate = parsed;
          }
        }

        productPages.push({
          url: `${baseUrl}/products/${slugOrId}`,
          lastModified: lastModDate,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch (e) {
    // Graceful fallback: If backend API temporarily fails, return staticPages with HTTP 200 instead of 500
    console.error("[SITEMAP] Backend fetch failed, falling back to static pages:", e);
  }

  return [...staticPages, ...productPages];
}
