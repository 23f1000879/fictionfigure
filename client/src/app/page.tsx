import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { getProducts, getCategories } from "@/lib/services/productService";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, Award } from "lucide-react";

export const revalidate = 0;

export default async function HomePage() {
  const [{ products: featuredProducts }, categories] = await Promise.all([
    getProducts({ featuredOnly: true, limit: 4 }),
    getCategories(),
  ]);

  return (
    <CartProvider>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="space-y-24 pb-12">
        {/* Editorial Hero Section */}
        <section className="relative bg-[#F0F0ED] border-b border-[#E5E5E2] overflow-hidden">
          <div className="editorial-container py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
                Curated Collector Gallery
              </span>

              <h1 className="text-3xl sm:text-5xl font-semibold text-[#111111] leading-[1.1] tracking-tight">
                Figures worth collecting. <br />
                <span className="text-[#6B6B6B]">Stories worth keeping.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed">
                Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/shop"
                  className="px-8 py-3.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors text-center"
                >
                  Shop Collection
                </Link>
                <Link
                  href="/shop?sortBy=newest"
                  className="px-8 py-3.5 bg-transparent border border-[#E5E5E2] text-[#111111] text-xs font-semibold uppercase tracking-widest hover:border-[#111111] transition-colors text-center"
                >
                  Explore New Arrivals
                </Link>
              </div>
            </div>

            {/* Hero Image Block */}
            <div className="relative aspect-[4/3] lg:aspect-[5/4] bg-white border border-[#E5E5E2] overflow-hidden shadow-sm">
              <Image
                src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80"
                alt="Shadow Sovereign 1/6 Scale Figure"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xs p-4 border border-[#E5E5E2] flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">Featured Masterpiece</span>
                  <h4 className="text-xs font-semibold text-[#111111]">Shadow Sovereign 1/6 Scale</h4>
                </div>
                <Link
                  href="/products/shadow-sovereign-1-6-scale-figure"
                  className="text-xs font-semibold text-[#111111] hover:underline flex items-center"
                >
                  View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

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
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative aspect-[4/5] bg-white border border-[#E5E5E2] overflow-hidden block"
              >
                {cat.imageUrl && (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] uppercase tracking-widest text-white/70 font-mono">
                    Category
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">{cat.name}</h3>
                  <span className="text-xs text-white/90 mt-1 flex items-center font-medium group-hover:underline">
                    Explore items <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </Link>
            ))}
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
    </CartProvider>
  );
}
