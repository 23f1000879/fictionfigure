"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, FolderTree } from "lucide-react";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  _count?: {
    products?: number;
  };
}

interface CategoryShowcaseProps {
  categories: CategoryItem[];
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!categories || categories.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const distance = 440;
    scrollRef.current.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  };

  return (
    <section className="editorial-container space-y-4" aria-label="Shop By Category">
      {/* Editorial Section Header */}
      <div className="flex items-end justify-between border-b border-[#E5E5E2] pb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] block mb-0.5">
            CATEGORIES
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight uppercase">
            Shop By Category
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* Scroll Chevrons for Desktop Carousel */}
          <div className="hidden sm:flex items-center space-x-1.5">
            <button
              onClick={() => scroll("left")}
              type="button"
              aria-label="Previous categories"
              className="w-8 h-8 flex items-center justify-center bg-white border border-[#E5E5E2] hover:border-[#111111] text-[#111111] transition-colors rounded-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              type="button"
              aria-label="Next categories"
              className="w-8 h-8 flex items-center justify-center bg-white border border-[#E5E5E2] hover:border-[#111111] text-[#111111] transition-colors rounded-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/shop"
            className="text-xs font-bold uppercase tracking-wider text-[#111111] hover:text-[#D4AF37] transition-colors flex items-center group"
          >
            <span>VIEW ALL</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Horizontal Merchandising Category Strip */}
      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-3 sm:gap-4 overflow-x-auto scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden py-1 select-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => {
          const imageSrc = cat.imageUrl || cat.image;
          const productCount = cat._count?.products;

          return (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group flex-none w-[150px] sm:w-[180px] lg:w-[210px] block transition-all duration-180"
            >
              {/* Image-First Poster Display */}
              <div className="relative aspect-[3/4] bg-[#FFFFFF] border border-[#E5E5E2] group-hover:border-[#111111] p-3 overflow-hidden transition-all duration-180">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 210px"
                    className="object-contain object-center group-hover:scale-104 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-[#111111]/90 flex items-center justify-center p-4">
                    <FolderTree className="w-10 h-10 text-white/20" />
                  </div>
                )}
              </div>

              {/* Clean Typography Label */}
              <div className="pt-2 px-0.5">
                <h3 className="text-xs font-bold text-[#111111] group-hover:text-[#D4AF37] transition-colors uppercase tracking-wider truncate">
                  {cat.name}
                </h3>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6B6B] mt-0.5">
                  <span>{productCount !== undefined ? `${productCount} ITEMS` : "COLLECTION"}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 group-hover:text-[#111111] transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
