"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface PromoBannerProps {
  categoryName?: string;
  categorySlug?: string;
  imageUrl?: string;
  description?: string;
}

export function PromoBanner({
  categoryName = "POSTERS & APPAREL",
  categorySlug = "posters",
  imageUrl,
}: PromoBannerProps) {
  return (
    <section className="editorial-container" aria-label="Merchandising Promo Strip">
      <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Category Info & Thumbnail */}
        <div className="flex items-center space-x-3.5 min-w-0">
          {imageUrl && (
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-[#F7F7F5] border border-[#E5E5E2] shrink-0 p-1">
              <Image
                src={imageUrl}
                alt={categoryName}
                fill
                sizes="56px"
                className="object-contain object-center"
              />
            </div>
          )}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] block">
              NEW DROPS & SELECTIONS
            </span>
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#111111] truncate">
              {categoryName}
            </h3>
          </div>
        </div>

        {/* Right CTA Link */}
        <Link
          href={`/shop?category=${categorySlug}`}
          className="inline-flex items-center px-4 py-2 bg-[#111111] text-white hover:bg-[#D4AF37] hover:text-[#111111] text-xs font-bold uppercase tracking-wider transition-colors duration-150 rounded-none shrink-0 group"
        >
          <span>SHOP NOW</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
