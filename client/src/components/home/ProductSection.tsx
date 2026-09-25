"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ViewAllTile } from "@/components/collection/CategoryTile";

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  category?: { name: string };
  images: { url: string; altText?: string | null }[];
  variants?: { id: string; title: string; price: number; sku: string; inventoryCount: number }[];
}

interface ProductSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  viewAllUrl?: string;
  viewAllText?: string;
  products: ProductItem[];
  /** full = compact cards on a horizontal rail; compact = grid beside another editorial block */
  layout?: "full" | "compact";
}

export function ProductSection({
  eyebrow = "FEATURED FIGURES",
  title,
  description,
  viewAllUrl = "/shop",
  viewAllText = "View All",
  products,
  layout = "full",
}: ProductSectionProps) {
  const railRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (layout === "compact") {
    const shown = products.slice(0, 6);
    const needsFiller = shown.length % 3 !== 0;
    return (
      <section aria-label={title} className="h-full flex flex-col gap-4 lg:gap-5">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          linkText={viewAllText}
          linkUrl={viewAllUrl}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
          {shown.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {needsFiller && viewAllUrl && (
            <ViewAllTile href={viewAllUrl} eyebrow="The Vault" title="Shop All Figures" />
          )}
        </div>
      </section>
    );
  }

  return (
    <section aria-label={title} className="flex flex-col gap-4 lg:gap-5">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          linkText={viewAllText}
          linkUrl={viewAllUrl}
          className="flex-1 min-w-0"
        />
        {products.length > 5 && (
          <div className="hidden md:flex items-center gap-1.5 pb-0.5">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Scroll products left"
              className="w-8 h-8 rounded-full border border-white/15 text-white/80 hover:border-white/40 hover:text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Scroll products right"
              className="w-8 h-8 rounded-full border border-white/15 text-white/80 hover:border-white/40 hover:text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={railRef}
        className="flex gap-3 lg:gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[46%] sm:w-[31%] md:w-[23.5%] lg:w-[calc((100%-4*16px)/5)] 2xl:w-[calc((100%-5*16px)/6)]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
