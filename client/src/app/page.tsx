import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getProducts, getCategories } from "@/lib/services/productService";
import { API_BASE } from "@/lib/api";
import { HeroCarousel, CarouselSlide } from "@/components/home/HeroCarousel";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { ProductSection } from "@/components/home/ProductSection";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TrustStrip } from "@/components/home/TrustStrip";
import { CollectorClub } from "@/components/home/CollectorClub";
import { DEFAULT_HOMEPAGE_CMS_CONFIG, DEFAULT_HOMEPAGE_SECTIONS } from "@/types/cms";

export const revalidate = 60; // 60s Vercel Edge ISR Cache

export const metadata: Metadata = {
  title: "FictionFigure | Authentic Anime Figures & Collectibles India",
  description: "Explore FictionFigure for premium collectible figures, scale anime statues, designer keychains, and action figures in India. Sourced directly from global studios with protective outer boxes.",
  alternates: {
    canonical: "https://www.fictionfigures.in",
  },
  openGraph: {
    title: "FictionFigure | Authentic Anime Figures & Collectibles India",
    description: "Explore FictionFigure for premium collectible figures, scale anime statues, designer keychains, and action figures in India.",
    url: "https://www.fictionfigures.in",
    siteName: "FictionFigure",
    images: [
      {
        url: "https://www.fictionfigures.in/fictionfigure-icon.svg",
        width: 800,
        height: 800,
        alt: "FictionFigure Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FictionFigure | Authentic Anime Figures & Collectibles India",
    description: "Explore FictionFigure for premium collectible figures, scale anime statues, designer keychains, and action figures in India.",
    images: ["https://www.fictionfigures.in/fictionfigure-icon.svg"],
  },
};

async function getHeroSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`, { next: { revalidate: 60 } });
    if (!res.ok) return { settings: {}, featuredProduct: null };
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch store settings for homepage hero:", err);
    return { settings: {}, featuredProduct: null };
  }
}

/** Resolves a CMS destination (category / product / url) to a storefront href. */
function resolveDestination(type: string | undefined, value: string | undefined, fallback: string) {
  const v = (value || "").trim();
  if (!v) return fallback;
  if (type === "category") return `/shop?category=${v}`;
  if (type === "product") return v.startsWith("/") ? v : `/products/${v}`;
  return v;
}

/*
 * Editorial grid packing.
 * The reference composes the page as a curated grid (products beside a campaign banner,
 * trust strip beside the club panel) instead of stacking every section full-width.
 * Sections keep their CMS order and visibility; consecutive partial-width blocks share a row.
 *   n = narrow (5/12), w = wide (7/12), f = always full width
 */
type BlockSize = "n" | "w" | "f";
interface EditorialBlock {
  key: string;
  size: BlockSize;
  render: (paired: boolean) => React.ReactNode;
}

function packRows(blocks: EditorialBlock[]): EditorialBlock[][] {
  const rows: EditorialBlock[][] = [];
  let pending: EditorialBlock | null = null;
  for (const block of blocks) {
    if (block.size === "f") {
      if (pending) rows.push([pending]);
      pending = null;
      rows.push([block]);
      continue;
    }
    if (!pending) {
      pending = block;
      continue;
    }
    if (pending.size === "w" && block.size === "w") {
      rows.push([pending]);
      pending = block;
      continue;
    }
    rows.push([pending, block]);
    pending = null;
  }
  if (pending) rows.push([pending]);
  return rows;
}

function spanClass(row: EditorialBlock[], i: number) {
  if (row.length === 1) return "lg:col-span-12";
  const [a, b] = row;
  if (a.size === "n" && b.size === "n") return "lg:col-span-6";
  return row[i].size === "n" ? "lg:col-span-5" : "lg:col-span-7";
}

export default async function HomePage() {
  const [newArrivalsRes, popularRes, categories, heroData] = await Promise.all([
    getProducts({ sortBy: "newest", limit: 8 }),
    getProducts({ limit: 8 }),
    getCategories(),
    getHeroSettings(),
  ]);

  const settings = heroData?.settings || {};
  const heroEnabled = settings.homepage_hero_enabled !== "false";
  const cmsConfig = heroData?.homepageCmsConfig || DEFAULT_HOMEPAGE_CMS_CONFIG;
  const sectionsOrder = cmsConfig?.sectionsOrder || DEFAULT_HOMEPAGE_SECTIONS;

  const newArrivalsLimit = Number(cmsConfig?.newArrivals?.limit) || 8;
  const moreLimit = Number(cmsConfig?.moreToCollect?.limit) || 8;
  const newArrivals = (newArrivalsRes?.products || []).slice(0, newArrivalsLimit);
  // Never show the same pieces twice on one page: "More to collect" skips what New Arrivals already shows.
  const shownIds = new Set(newArrivals.map((p: any) => p.id));
  const popularProducts = (popularRes?.products || [])
    .filter((p: any) => !shownIds.has(p.id))
    .slice(0, moreLimit);

  // Carousel slides from backend API or dynamic fallback using existing category assets
  const slides: CarouselSlide[] =
    heroData?.carouselSlides && heroData.carouselSlides.length > 0
      ? heroData.carouselSlides
      : [
          {
            id: "1",
            image:
              settings.homepage_hero_image_url ||
              "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
            eyebrow: settings.homepage_hero_eyebrow || "CURATED COLLECTOR GALLERY",
            title: settings.homepage_hero_title || "Figures worth collecting.",
            titleAccent: settings.homepage_hero_title_accent || "Stories worth keeping.",
            description:
              settings.homepage_hero_description ||
              "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.",
            primaryLabel: settings.homepage_hero_primary_label || "SHOP COLLECTION",
            primaryUrl: settings.homepage_hero_primary_url || "/shop",
            enabled: true,
          },
          ...(categories || [])
            .filter((c: any) => c.imageUrl || c.image)
            .slice(0, 3)
            .map((c: any, i: number) => ({
              id: `cat-${c.id || i}`,
              image: c.imageUrl || c.image,
              eyebrow: "FEATURED COLLECTION",
              title: c.name,
              description: c.description || `Explore authentic figures and items in the ${c.name} collection.`,
              primaryLabel: "EXPLORE COLLECTION",
              primaryUrl: `/shop?category=${c.slug}`,
              enabled: true,
            })),
        ];

  // Shop-by-category honours the CMS selection and per-category image overrides.
  const selectedIds: string[] = cmsConfig?.shopByCategory?.selectedCategoryIds || [];
  const imageOverrides: Record<string, string> = cmsConfig?.shopByCategory?.imageOverrides || {};
  const showcaseCategories = (
    selectedIds.length > 0
      ? selectedIds.map((id) => (categories || []).find((c: any) => c.id === id)).filter(Boolean)
      : categories || []
  ).map((c: any) => (imageOverrides[c.id] ? { ...c, imageUrl: imageOverrides[c.id] } : c));

  // Real category / product / campaign artwork for the editorial panels
  const categoriesWithImages = (categories || []).filter((c: any) => c.imageUrl || c.image);
  const featuredCat = categoriesWithImages[0] || null;
  const promoCat = categoriesWithImages[1] || categoriesWithImages[0] || null;
  const newestArtwork: string | undefined = newArrivals[0]?.images?.[0]?.url;
  const heroArtwork: string | undefined = settings.homepage_hero_image_url || slides[0]?.image;

  const storeName = settings.store_name || "FictionFigure";
  const supportPhone = settings.support_phone || "+91 97974 94639";
  const supportEmail = settings.support_email || "support@fictionfigure.in";
  const supportHours = settings.support_hours || "Monday - Saturday, 10:00 AM - 7:00 PM";

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": storeName,
    "url": "https://www.fictionfigures.in",
    "logo": "https://www.fictionfigures.in/fictionfigure-icon.svg",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": supportPhone,
      "contactType": "customer service",
      "email": supportEmail,
      "hoursAvailable": supportHours,
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": storeName,
    "url": "https://www.fictionfigures.in",
  };

  const buildBlock = (sectionId: string): EditorialBlock | null => {
    switch (sectionId) {
      case "categories": {
        if (cmsConfig?.shopByCategory?.enabled === false || showcaseCategories.length === 0) return null;
        return {
          key: "categories",
          size: showcaseCategories.length >= 4 ? "f" : "n",
          render: (paired) => (
            <CategoryShowcase
              categories={showcaseCategories}
              eyebrow={cmsConfig?.shopByCategory?.eyebrow || "CURATED UNIVERSE"}
              title={cmsConfig?.shopByCategory?.title || "SHOP BY CATEGORY"}
              viewAllText={cmsConfig?.shopByCategory?.ctaText || "View All"}
              viewAllUrl={cmsConfig?.shopByCategory?.ctaUrl || "/collections"}
              layout={paired ? "compact" : "full"}
            />
          ),
        };
      }
      case "new_arrivals":
        if (cmsConfig?.newArrivals?.enabled === false || newArrivals.length === 0) return null;
        return {
          key: "new_arrivals",
          size: newArrivals.length >= 4 ? "f" : "n",
          render: (paired) => (
            <ProductSection
              eyebrow={cmsConfig?.newArrivals?.eyebrow || "FRESHLY ADDED TO COLLECTION"}
              title={cmsConfig?.newArrivals?.title || "NEW ARRIVALS"}
              viewAllUrl={cmsConfig?.newArrivals?.ctaUrl || "/shop?sortBy=newest"}
              viewAllText={cmsConfig?.newArrivals?.ctaText || "View All"}
              products={newArrivals}
              layout={paired ? "compact" : "full"}
            />
          ),
        };
      case "featured_collection": {
        if (cmsConfig?.featuredCollection?.enabled === false || !featuredCat) return null;
        const fc = cmsConfig?.featuredCollection || {};
        return {
          key: "featured_collection",
          size: "w",
          render: () => (
            <FeaturedCollection
              title={fc.title || featuredCat.name}
              subtitle={fc.eyebrow || "SPOTLIGHT COLLECTION"}
              description={fc.description || featuredCat.description || "Authentic collectible figures and merchandise directly from global studios."}
              imageUrl={fc.imageUrl || featuredCat.imageUrl || featuredCat.image || undefined}
              shopUrl={resolveDestination(fc.ctaDestinationType, fc.ctaDestinationValue, `/shop?category=${featuredCat.slug}`)}
              buttonLabel={fc.ctaText || `EXPLORE ${featuredCat.name}`}
            />
          ),
        };
      }
      case "more_to_collect":
        if (cmsConfig?.moreToCollect?.enabled === false || popularProducts.length === 0) return null;
        return {
          key: "more_to_collect",
          size: popularProducts.length >= 4 ? "f" : "n",
          render: (paired) => (
            <ProductSection
              eyebrow={cmsConfig?.moreToCollect?.eyebrow || "CATALOG HIGHLIGHTS"}
              title={cmsConfig?.moreToCollect?.title || "MORE TO COLLECT"}
              viewAllUrl={cmsConfig?.moreToCollect?.ctaUrl || "/shop"}
              viewAllText={cmsConfig?.moreToCollect?.ctaText || "View All"}
              products={popularProducts}
              layout={paired ? "compact" : "full"}
            />
          ),
        };
      case "promo_banner": {
        if (cmsConfig?.promoBanner?.enabled === false) return null;
        const pb = cmsConfig?.promoBanner || {};
        const promoImage = pb.bgImageUrl || newestArtwork || promoCat?.imageUrl || promoCat?.image;
        if (!promoImage) return null;
        return {
          key: "promo_banner",
          size: "w",
          render: () => (
            <PromoBanner
              eyebrow={pb.eyebrow || "NEW DROPS"}
              headline={pb.headline || promoCat?.name || "Fresh collectibles have arrived"}
              description={pb.description || promoCat?.description || undefined}
              ctaText={pb.ctaText || "SHOP NOW"}
              ctaUrl={resolveDestination(
                pb.ctaDestinationType,
                pb.ctaDestinationValue,
                promoCat ? `/shop?category=${promoCat.slug}` : "/shop?sortBy=newest"
              )}
              imageUrl={promoImage}
              overlayStrength={typeof pb.overlayStrength === "number" ? pb.overlayStrength : 60}
              textAlign={pb.textAlign || "left"}
            />
          ),
        };
      }
      case "trust_strip":
        if (cmsConfig?.trustStrip?.enabled === false) return null;
        return {
          key: "trust_strip",
          size: "n",
          render: (paired) => (
            <TrustStrip items={cmsConfig?.trustStrip?.items} layout={paired ? "compact" : "full"} />
          ),
        };
      default:
        return null;
    }
  };

  const blocks: EditorialBlock[] = sectionsOrder
    .filter((sec: any) => sec.id !== "hero" && sec.enabled)
    .map((sec: any) => buildBlock(sec.id))
    .filter(Boolean) as EditorialBlock[];

  blocks.push({
    key: "collector_club",
    size: "w",
    render: () => <CollectorClub imageUrl={heroArtwork} />,
  });

  const rows = packRows(blocks);

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <SearchModal />
      <CartDrawer />

      <main className="flex-1 flex flex-col bg-[#08090B] text-[#F7F7F5]">
        {heroEnabled && (
          <HeroCarousel
            slides={slides}
            trustItems={cmsConfig?.trustStrip?.items}
            secondaryLabel={settings.homepage_hero_secondary_label}
            secondaryUrl={settings.homepage_hero_secondary_url}
          />
        )}

        <div className="ff-container flex flex-col gap-12 lg:gap-16 pt-12 lg:pt-16 pb-16 lg:pb-20">
          {rows.map((row) => (
            <div
              key={row.map((b) => b.key).join("+")}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-stretch"
            >
              {row.map((block, i) => (
                <div key={block.key} className={`min-w-0 ${spanClass(row, i)}`}>
                  {block.render(row.length > 1)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
