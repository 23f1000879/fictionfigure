import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getCategories } from "@/lib/services/productService";
import { CategoryTile } from "@/components/collection/CategoryTile";
import { API_BASE } from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Anime Collections & Universes",
  description:
    "Explore all authentic anime figure collections, scale statues, keychains, and exclusive merchandise at Fiction Figures.",
  alternates: {
    canonical: "/collections",
  },
};

/**
 * Cinematic backdrop for the universe browser, in priority order:
 * 1. `collections_hero_image_url` store setting (Admin → Settings → Universes page background)
 * 2. the first homepage hero slide's cinematic background (existing campaign art)
 * Nothing is invented: with neither set, the section falls back to a plain dark atmosphere.
 */
async function getBackdrop(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/settings`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    const configured = data?.settings?.collections_hero_image_url;
    if (typeof configured === "string" && configured.trim()) return configured.trim();
    const slide = (data?.carouselSlides || []).find((s: any) => s?.backgroundImage);
    return slide?.backgroundImage || null;
  } catch {
    return null;
  }
}

export default async function CollectionsPage() {
  const [categories, backdrop] = await Promise.all([getCategories(), getBackdrop()]);

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="flex-1 bg-background text-foreground">
        {/* One cinematic scene behind the heading and the universe grid */}
        <section className="ff-media relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10" aria-hidden>
            {backdrop ? (
              <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-[70%_30%]" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_0%,rgba(245,197,24,0.10),transparent_55%),radial-gradient(ellipse_at_10%_30%,rgba(139,92,246,0.08),transparent_50%)]" />
            )}
            {/* Art stays visible behind the heading, deepening toward the card grid */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#08090B]/55 via-[#08090B]/80 to-[#08090B]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08090B]/70 via-[#08090B]/20 to-transparent" />
          </div>

          <div className="ff-container pt-6 pb-12 lg:pt-8 lg:pb-16">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[#9A9DA5]">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-[#4A4D55]" aria-hidden>
                /
              </span>
              <span className="text-[#F7F7F5]" aria-current="page">
                Collections
              </span>
            </nav>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-[34px] sm:text-[42px] lg:text-[48px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]">
                  Collections
                </h1>
                <p className="text-[14px] text-[#F7F7F5]/80">Explore figures from your favourite anime series.</p>
              </div>
              <Link href="/shop" className="ff-link-arrow self-start sm:self-auto min-h-[44px] text-[12px] uppercase tracking-[0.1em]">
                Shop all figures <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {categories.length === 0 ? (
              <p className="mt-8 text-[14px] text-[#9A9DA5]">No collections are published yet.</p>
            ) : (
              <ul className="mt-6 lg:mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {categories.map((cat: any, i: number) => (
                  <li key={cat.id}>
                    <CategoryTile
                      category={cat}
                      size="lg"
                      aspect="aspect-[16/10]"
                      focus="center 25%"
                      priority={i < 3}
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer showValueStrip={false} />
    </>
  );
}
