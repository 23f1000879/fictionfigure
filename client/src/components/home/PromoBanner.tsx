"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

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
  description = "Explore high-definition posters, keychains, and graphic merchandise.",
}: PromoBannerProps) {
  return (
    <section className="editorial-container" aria-label="Merchandising Promo Banner">
      <div className="relative bg-[#121318] border border-white/10 rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-black/60 overflow-hidden group">
        {/* Subtle background gradient highlight */}
        <div className="absolute top-0 right-1/3 w-64 h-64 bg-[#F5C518]/[0.04] rounded-full blur-2xl pointer-events-none" />

        {/* Left Category Info & Thumbnail */}
        <div className="flex items-center space-x-4 min-w-0 z-10">
          {imageUrl && (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-[#0E0F13] border border-white/10 rounded-xl shrink-0 p-1.5 flex items-center justify-center overflow-hidden">
              <Image
                src={imageUrl}
                alt={categoryName}
                fill
                sizes="80px"
                className="object-contain object-center group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#F5C518]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FRESH DROPS FOR COLLECTORS</span>
            </div>
            <h3 className="text-base sm:text-xl font-bold uppercase tracking-tight text-white truncate">
              {categoryName}
            </h3>
            {description && (
              <p className="text-xs text-[#94A3B8] line-clamp-1 max-w-md">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right CTA Button */}
        <Link
          href={`/shop?category=${categorySlug}`}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-[#F5C518] text-white hover:text-[#0A0A0C] border border-white/15 hover:border-[#F5C518] text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0 min-h-[44px] shadow-sm group/btn z-10"
        >
          <span>EXPLORE DROPS</span>
          <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
