"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, FolderTree, Sparkles } from "lucide-react";

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
  eyebrow?: string;
  title?: string;
  viewAllText?: string;
  viewAllUrl?: string;
}

export function CategoryShowcase({
  categories,
  eyebrow = "COLLECT YOUR UNIVERSE",
  title = "SHOP BY ANIME SERIES & SCALE",
  viewAllText = "VIEW ALL COLLECTIONS",
  viewAllUrl = "/collections",
}: CategoryShowcaseProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!categories || categories.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const distance = 460;
    scrollRef.current.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  };

  return (
    <section className="editorial-container space-y-6" aria-label="Shop By Category and Series">
      {/* Editorial Section Header */}
      <div className="flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#F5C518] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{eyebrow}</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight uppercase">
            {title}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* Scroll Chevrons for Desktop Carousel */}
          <div className="hidden sm:flex items-center space-x-2">
            <button
              onClick={() => scroll("left")}
              type="button"
              aria-label="Previous categories"
              className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center bg-white/[0.04] border border-white/10 hover:border-white/25 hover:bg-white/[0.08] text-white transition-all rounded-xl cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              type="button"
              aria-label="Next categories"
              className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center bg-white/[0.04] border border-white/10 hover:border-white/25 hover:bg-white/[0.08] text-white transition-all rounded-xl cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            href={viewAllUrl}
            className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#F5C518] transition-colors flex items-center group font-mono"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Horizontal Merchandising Category Strip */}
      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-4 sm:gap-5 overflow-x-auto scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden py-2 select-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => {
          const imageSrc = cat.imageUrl || cat.image;
          const productCount = cat._count?.products;

          return (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group flex-none w-[170px] sm:w-[210px] lg:w-[240px] block transition-all duration-300"
            >
              {/* Image-First Poster Display */}
              <div className="relative aspect-[3/4] bg-[#121318] border border-white/[0.08] group-hover:border-[#F5C518]/40 group-hover:shadow-cardHover rounded-2xl p-3.5 overflow-hidden transition-all duration-300 flex flex-col justify-between">
                {/* Artwork Area */}
                <div className="relative w-full h-[75%] rounded-xl overflow-hidden bg-[#0E0F13] flex items-center justify-center p-2">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 170px, (max-width: 1024px) 210px, 240px"
                      className="object-contain object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#64748B]">
                      <FolderTree className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Typography Label inside Card */}
                <div className="pt-2 px-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#F5C518] transition-colors uppercase tracking-wider truncate">
                    {cat.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mt-0.5">
                    <span>
                      {productCount !== undefined ? `${productCount} Products` : "Universe Collection"}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/[0.04] group-hover:bg-[#F5C518] group-hover:text-[#0A0A0C] flex items-center justify-center text-[#94A3B8] transition-all">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
