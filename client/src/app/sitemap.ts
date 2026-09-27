import { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/services/productService";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

const MAX_PAGES = 50; // 100 products per page → up to 5,000 product URLs

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  // Public indexable pages only (account, checkout, cart, auth and order pages are excluded).
  const staticPages: MetadataRoute.Sitemap = [
    page("", "daily", 1.0),
    page("/shop", "daily", 0.9),
    page("/collections", "weekly", 0.9),
    page("/about", "monthly", 0.6),
    page("/contact", "monthly", 0.6),
    page("/shipping", "monthly", 0.5),
    page("/returns", "monthly", 0.5),
    page("/privacy", "yearly", 0.2),
    page("/terms", "yearly", 0.2),
  ];

  const collectionPages: MetadataRoute.Sitemap = [];
  const productPages: MetadataRoute.Sitemap = [];

  try {
    const categories = await getCategories();
    const seen = new Set<string>();
    for (const cat of Array.isArray(categories) ? categories : []) {
      const slug = (cat?.slug || "").toString().trim();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      collectionPages.push(page(`/collections/${slug}`, "weekly", 0.8));
    }
  } catch (e) {
    console.error("[SITEMAP] Category fetch failed:", e);
  }

  try {
    const seen = new Set<string>();
    for (let n = 1; n <= MAX_PAGES; n++) {
      const result = await getProducts({ limit: 100, page: n, inStockOnly: false });
      for (const p of result?.products || []) {
        if (!p || typeof p !== "object" || p.isActive === false) continue;
        const slug = (p.slug || p.id || "").toString().trim();
        if (!slug || seen.has(slug.toLowerCase())) continue;
        seen.add(slug.toLowerCase());

        const updated = p.updatedAt ? new Date(p.updatedAt) : now;
        productPages.push({
          url: `${SITE_URL}/products/${slug}`,
          lastModified: isNaN(updated.getTime()) ? now : updated,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      if (n >= (result?.totalPages || 1)) break;
    }
  } catch (e) {
    // If the API is briefly unavailable, still serve the static pages (HTTP 200, not 500).
    console.error("[SITEMAP] Product fetch failed:", e);
  }

  return [...staticPages, ...collectionPages, ...productPages];
}
