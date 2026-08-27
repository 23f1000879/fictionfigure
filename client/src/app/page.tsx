import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { getProducts, getCategories } from "@/lib/services/productService";
import { API_BASE } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, Award, FolderTree } from "lucide-react";

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
  const [{ products: featuredProducts }, categories, heroData] = await Promise.all([
    getProducts({ featuredOnly: true, limit: 4 }),
    getCategories(),
    getHeroSettings(),
  ]);

  const settings = heroData?.settings || {};
  const featuredProduct = heroData?.featuredProduct || null;

  // Fallback defaults matching current homepage
  const heroEnabled = settings.homepage_hero_enabled !== "false";
  const heroImageUrl =
    settings.homepage_hero_image_url ||
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80";
  const eyebrow = settings.homepage_hero_eyebrow || "CURATED COLLECTOR GALLERY";
  const title = settings.homepage_hero_title || "Figures worth collecting.";
  const titleAccent = settings.homepage_hero_title_accent || "Stories worth keeping.";
  const description =
    settings.homepage_hero_description ||
    "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.";
  const primaryLabel = settings.homepage_hero_primary_label || "SHOP COLLECTION";
  const primaryUrl = settings.homepage_hero_primary_url || "/shop";
  const secondaryLabel = settings.homepage_hero_secondary_label || "EXPLORE NEW ARRIVALS";
  const secondaryUrl = settings.homepage_hero_secondary_url || "/shop?sortBy=newest";

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
      "hoursAvailable": supportHours
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": storeName,
    "url": "https://www.fictionfigures.in"
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

      <main className="space-y-16 sm:space-y-24 pb-12">
        {/* Dynamic Admin-Managed Homepage Hero Section */}
        {heroEnabled && (
          <section className="relative bg-[#F0F0ED] border-b border-[#E5E5E2] overflow-hidden">
            <div className="editorial-container py-12 sm:py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6 max-w-xl">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
                  {eyebrow}
                </span>

                <h1 className="text-3xl sm:text-5xl font-semibold text-[#111111] leading-[1.1] tracking-tight break-words">
                  {title} <br />
                  {titleAccent && <span className="text-[#6B6B6B]">{titleAccent}</span>}
                </h1>

                <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed break-words">
                  {description}
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link
                    href={primaryUrl}
                    className="px-8 py-3.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors text-center"
                  >
                    {primaryLabel}
                  </Link>
                  <Link
                    href={secondaryUrl}
                    className="px-8 py-3.5 bg-transparent border border-[#E5E5E2] text-[#111111] text-xs font-semibold uppercase tracking-widest hover:border-[#111111] transition-colors text-center"
                  >
                    {secondaryLabel}
                  </Link>
                </div>
              </div>

              {/* Dynamic Hero Image Block */}
              <div className="relative aspect-[3/4] w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto lg:ml-auto lg:mr-0 border border-[#E5E5E2] overflow-hidden shadow-sm">
                <Image
                  src={heroImageUrl}
                  alt={title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-contain"
                />
                {featuredProduct && (
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xs p-4 border border-[#E5E5E2] flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                        Featured Masterpiece
                      </span>
                      <h4 className="text-xs font-semibold text-[#111111] truncate">
                        {featuredProduct.name}
                      </h4>
                    </div>
                    <Link
                      href={`/products/${featuredProduct.slug}`}
                      className="text-xs font-semibold text-[#111111] hover:underline flex items-center shrink-0"
                    >
                      View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Feature Value Props */}
        <section className="editorial-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-[#E5E5E2]">
            <div className="flex items-start space-x-4">
              <ShieldCheck className="w-6 h-6 text-[#111111] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111111]">
                  100% Authenticity Guaranteed
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Directly sourced from licensed Japanese and global studios with serialized seals.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Truck className="w-6 h-6 text-[#111111] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111111]">
                  Reinforced Collector Packaging
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Double-walled boxes with corner armor so mint boxes arrive untouched.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Award className="w-6 h-6 text-[#111111] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111111]">
                  Curated Inventory
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Every figure chosen for sculpt fidelity, paint density, and character presence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Collection Grid */}
        <section className="editorial-container space-y-8">
          <div className="flex items-end justify-between border-b border-[#E5E5E2] pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
                Editor's Selection
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#111111] tracking-tight">
                Featured Figures
              </h2>
            </div>
            <Link
              href="/shop?featuredOnly=true"
              className="text-xs font-semibold text-[#111111] hover:underline flex items-center"
            >
              View all featured <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Category Showcase */}
        <section className="editorial-container space-y-8">
          <div className="border-b border-[#E5E5E2] pb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
              Browse by Category
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#111111] tracking-tight">
              Curated Mediums
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((cat) => {
              const imageSrc = cat.imageUrl || cat.image;
              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative aspect-[3/4] bg-[#F7F7F5] border border-[#E5E5E2] overflow-hidden block shadow-xs"
                >
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={cat.name}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#111111]/90 flex items-center justify-center">
                      <FolderTree className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white pointer-events-none">
                    <span className="text-[10px] uppercase tracking-widest text-white/70 font-mono">
                      Category
                    </span>
                    <h3 className="text-lg font-semibold tracking-tight">{cat.name}</h3>
                    <span className="text-xs text-white/90 mt-1 flex items-center font-medium group-hover:underline">
                      Explore items <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Editorial Brand Section */}
        <section className="bg-white border-y border-[#E5E5E2] py-20">
          <div className="editorial-container text-center max-w-2xl mx-auto space-y-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B]">
              The FictionFigure Manifesto
            </span>
            <h2 className="text-2xl sm:text-4xl font-semibold text-[#111111] tracking-tight leading-tight">
              Collect what means something.
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
              "FictionFigure brings together figures and collectibles chosen for craftsmanship, character, and the stories behind them. We believe figures aren't plastic placeholders — they are tangible physical anchors to moments that stayed with us."
            </p>
            <div className="pt-2">
              <Link
                href="/about"
                className="inline-block px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
              >
                Our Curation Philosophy
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
