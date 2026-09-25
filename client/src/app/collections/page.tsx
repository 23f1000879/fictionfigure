import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getCategories } from "@/lib/services/productService";
import { CategoryTile, ViewAllTile } from "@/components/collection/CategoryTile";
import { ArtworkFrame } from "@/components/ui/Artwork";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "All Collections & Series | FICTIONFIGURE",
  description:
    "Explore all authentic anime figure collections, scale statues, keychains, and exclusive merchandise across the FICTIONFIGURE universe.",
  alternates: {
    canonical: "https://www.fictionfigures.in/collections",
  },
};

export default async function CollectionsPage() {
  const categories = await getCategories();
  const headerArt: string | undefined = categories.find((c: any) => c.imageUrl || c.image)?.imageUrl;

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="flex-1 bg-[#08090B] text-[#F7F7F5]">
        {/* Reference header: breadcrumb, large title, short description over atmospheric artwork */}
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          {headerArt && <ArtworkFrame src={headerArt} alt="" mode="ambient" ambientOpacity={0.35} />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090B] via-[#08090B]/85 to-[#08090B]/30" />
          <div className="ff-container relative py-8 sm:py-10 lg:py-12 min-h-[170px] lg:min-h-[200px] flex flex-col justify-center gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-[#9A9DA5]">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-[#4A4D55]">/</span>
              <span className="text-[#F7F7F5]">Collections</span>
            </nav>
            <h1 className="text-[32px] sm:text-[42px] lg:text-[48px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
              Collections
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#9A9DA5]">
              Explore figures from your favourite anime series.
            </p>
          </div>
        </section>

        <div className="ff-container py-6 lg:py-8 pb-16 lg:pb-20">
          {categories.length === 0 ? (
            <div className="ff-panel p-10 text-center space-y-4">
              <p className="text-[14px] text-[#9A9DA5]">No collections are published yet.</p>
              <Link href="/shop" className="ff-btn ff-btn-gold ff-btn-sm">
                Browse the shop <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {categories.map((cat: any, i: number) => (
                <CategoryTile
                  key={cat.id}
                  category={cat}
                  size="lg"
                  aspect="aspect-[4/5] sm:aspect-[20/21]"
                  priority={i < 3}
                  sizes="(max-width: 1024px) 50vw, 33vw"
                />
              ))}
              <ViewAllTile
                href="/shop"
                eyebrow="Full catalog"
                title="Shop All Figures"
                aspect="aspect-[4/5] sm:aspect-[20/21]"
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
