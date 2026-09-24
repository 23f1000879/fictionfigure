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

export default async function HomePage() {
  const [newArrivalsRes, popularRes, categories, heroData] = await Promise.all([
    getProducts({ sortBy: "newest", limit: 8 }),
    getProducts({ limit: 8 }),
    getCategories(),
    getHeroSettings(),
  ]);

  const newArrivals = newArrivalsRes?.products || [];
  const popularProducts = popularRes?.products || [];

  const settings = heroData?.settings || {};
  const heroEnabled = settings.homepage_hero_enabled !== "false";

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

  // Select real categories with images for featured & promo banners
  const categoriesWithImages = (categories || []).filter((c: any) => c.imageUrl || c.image);
  const featuredCat = categoriesWithImages[0] || null;
  const promoCat = categoriesWithImages[1] || categoriesWithImages[0] || null;

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

      <main className="flex-1 flex flex-col min-h-0 p-0 m-0 bg-[#F7F7F5]">
        {/* Phase 2 Finished Hero Carousel */}
        {heroEnabled && <HeroCarousel slides={slides} />}

        {/* Below-The-Hero Editorial Merchandising Sections */}
        <div className="space-y-10 sm:space-y-14 py-8 sm:py-12">
          {/* Section 1: Shop By Category */}
          <CategoryShowcase categories={categories} />

          {/* Section 2: New Arrivals Product Grid */}
          <ProductSection
            eyebrow="FRESHLY ADDED TO COLLECTION"
            title="NEW ARRIVALS"
            viewAllUrl="/shop?sortBy=newest"
            viewAllText="VIEW ALL NEW"
            products={newArrivals}
          />

          {/* Section 3: Featured Collection Spotlight Banner */}
          {featuredCat && (
            <FeaturedCollection
              title={featuredCat.name}
              subtitle="SPOTLIGHT COLLECTION"
              description={featuredCat.description || "Authentic collectible figures and merchandise directly from global studios."}
              imageUrl={featuredCat.imageUrl || featuredCat.image || undefined}
              shopUrl={`/shop?category=${featuredCat.slug}`}
              buttonLabel={`EXPLORE ${featuredCat.name}`}
            />
          )}

          {/* Section 4: Truthful Catalog Selections */}
          <ProductSection
            eyebrow="CATALOG HIGHLIGHTS"
            title="MORE TO COLLECT"
            viewAllUrl="/shop"
            viewAllText="EXPLORE ALL"
            products={popularProducts}
          />

          {/* Section 5: Secondary Promotional Banner */}
          {promoCat && promoCat.id !== featuredCat?.id && (
            <PromoBanner
              categoryName={promoCat.name}
              categorySlug={promoCat.slug}
              imageUrl={promoCat.imageUrl || promoCat.image || undefined}
              description={promoCat.description || "Explore high-definition posters, keychains, and graphic apparel."}
            />
          )}

          {/* Section 6: Trust & Service Benefits Strip */}
          <TrustStrip />
        </div>
      </main>

      <Footer />
    </>
  );
}
