import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, FolderTree } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getCategories } from "@/lib/services/productService";

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

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="flex-1 bg-[#0A0A0C] text-[#F8FAFC] min-h-screen py-10 sm:py-16">
        <div className="editorial-container space-y-12">
          {/* 1. Page Header */}
          <div className="relative bg-gradient-to-br from-[#121318] via-[#181920] to-[#0E0F14] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-black/80 overflow-hidden">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F5C518]/[0.05] rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#F5C518]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COLLECT YOUR UNIVERSE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                ALL ANIME COLLECTIONS & SERIES
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                Browse official scale figures, limited statues, and collectible merchandise curated by series, studios, and characters.
              </p>
            </div>
          </div>

          {/* 2. Visual Universe Browser Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {categories.map((cat: any) => {
              const imageSrc = cat.imageUrl || cat.image;
              const productCount = cat._count?.products;

              return (
                <Link
                  key={cat.id}
                  href={`/collections/${cat.slug}`}
                  className="group relative bg-[#121318] border border-white/10 hover:border-[#F5C518]/40 hover:shadow-cardHover rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between p-5"
                >
                  {/* Category Image Viewport */}
                  <div className="relative aspect-[16/11] bg-[#0E0F13] border border-white/[0.06] rounded-xl overflow-hidden flex items-center justify-center p-4">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain object-center p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#64748B]">
                        <FolderTree className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white group-hover:text-[#F5C518] transition-colors">
                        {cat.name}
                      </h2>
                      <span className="text-xs font-mono text-[#64748B] block mt-0.5">
                        {productCount !== undefined ? `${productCount} Figures Available` : "Explore Universe"}
                      </span>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] group-hover:bg-[#F5C518] group-hover:text-[#0A0A0C] border border-white/10 flex items-center justify-center text-white/80 transition-all shrink-0">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 3. Direct Full Catalog Link */}
          <div className="text-center pt-8 border-t border-white/10">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 text-white font-mono text-xs uppercase tracking-wider transition-all"
            >
              <span>View All Products in Full Catalog</span>
              <ArrowRight className="w-4 h-4 text-[#F5C518]" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
