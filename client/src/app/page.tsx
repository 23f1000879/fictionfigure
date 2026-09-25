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

import { DEFAULT_HOMEPAGE_CMS_CONFIG, DEFAULT_HOMEPAGE_SECTIONS } from "@/types/cms";

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
  const cmsConfig = heroData?.homepageCmsConfig || DEFAULT_HOMEPAGE_CMS_CONFIG;
  const sectionsOrder = cmsConfig?.sectionsOrder || DEFAULT_HOMEPAGE_SECTIONS;

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

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "categories":
        if (cmsConfig?.shopByCategory?.enabled === false) return null;
        return (
          <CategoryShowcase
            key="categories"
            categories={categories}
            eyebrow={cmsConfig?.shopByCategory?.eyebrow || "CURATED UNIVERSE"}
            title={cmsConfig?.shopByCategory?.title || "SHOP BY CATEGORY"}
            viewAllText={cmsConfig?.shopByCategory?.ctaText || "EXPLORE ALL CATEGORIES"}
            viewAllUrl={cmsConfig?.shopByCategory?.ctaUrl || "/collections"}
          />
        );
      case "new_arrivals":
        if (cmsConfig?.newArrivals?.enabled === false) return null;
        return (
          <ProductSection
            key="new_arrivals"
            eyebrow={cmsConfig?.newArrivals?.eyebrow || "FRESHLY ADDED TO COLLECTION"}
            title={cmsConfig?.newArrivals?.title || "NEW ARRIVALS"}
            viewAllUrl={cmsConfig?.newArrivals?.ctaUrl || "/shop?sortBy=newest"}
            viewAllText={cmsConfig?.newArrivals?.ctaText || "VIEW ALL NEW"}
            products={newArrivals}
          />
        );
      case "featured_collection":
        if (cmsConfig?.featuredCollection?.enabled === false) return null;
        if (!featuredCat) return null;
        return (
          <FeaturedCollection
            key="featured_collection"
            title={cmsConfig?.featuredCollection?.title || featuredCat.name}
            subtitle={cmsConfig?.featuredCollection?.eyebrow || "SPOTLIGHT COLLECTION"}
            description={cmsConfig?.featuredCollection?.description || featuredCat.description || "Authentic collectible figures and merchandise directly from global studios."}
            imageUrl={cmsConfig?.featuredCollection?.imageUrl || featuredCat.imageUrl || featuredCat.image || undefined}
            shopUrl={cmsConfig?.featuredCollection?.ctaDestinationValue ? `/shop?category=${cmsConfig.featuredCollection.ctaDestinationValue}` : `/shop?category=${featuredCat.slug}`}
            buttonLabel={cmsConfig?.featuredCollection?.ctaText || `EXPLORE ${featuredCat.name}`}
          />
        );
      case "more_to_collect":
        if (cmsConfig?.moreToCollect?.enabled === false) return null;
        return (
          <ProductSection
            key="more_to_collect"
            eyebrow={cmsConfig?.moreToCollect?.eyebrow || "CATALOG HIGHLIGHTS"}
            title={cmsConfig?.moreToCollect?.title || "MORE TO COLLECT"}
            viewAllUrl={cmsConfig?.moreToCollect?.ctaUrl || "/shop"}
            viewAllText={cmsConfig?.moreToCollect?.ctaText || "EXPLORE ALL"}
            products={popularProducts}
          />
        );
      case "promo_banner":
        if (cmsConfig?.promoBanner?.enabled === false) return null;
        if (!promoCat) return null;
        return (
          <PromoBanner
            key="promo_banner"
            categoryName={promoCat.name}
            categorySlug={promoCat.slug}
            imageUrl={cmsConfig?.promoBanner?.bgImageUrl || promoCat.imageUrl || promoCat.image || undefined}
            description={cmsConfig?.promoBanner?.description || promoCat.description || "Explore high-definition posters, keychains, and graphic apparel."}
          />
        );
      case "trust_strip":
        if (cmsConfig?.trustStrip?.enabled === false) return null;
        return <TrustStrip key="trust_strip" />;
      default:
        return null;
    }
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

      <main className="flex-1 flex flex-col min-h-0 p-0 m-0 bg-[#0A0A0C] text-[#F8FAFC]">
        {/* Phase 8.2 Cinematic Hero Carousel */}
        {heroEnabled && <HeroCarousel slides={slides} />}

        {/* Dynamic Section Rendering based on Saved Section Order & Visibility */}
        <div className="space-y-14 sm:space-y-20 py-10 sm:py-16">
          {sectionsOrder
            .filter((sec: any) => sec.id !== "hero" && sec.enabled)
            .map((sec: any) => renderSection(sec.id))}
        </div>
      </main>

      <Footer />
    </>
  );
}
