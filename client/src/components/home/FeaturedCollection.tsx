"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

interface FeaturedCollectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  shopUrl?: string;
  buttonLabel?: string;
}

export function FeaturedCollection({
  title = "FEATURED COLLECTION",
  subtitle = "SPOTLIGHT COLLECTION",
  description,
  imageUrl,
  shopUrl = "/shop",
  buttonLabel = "EXPLORE COLLECTION",
}: FeaturedCollectionProps) {
  if (!imageUrl) return null;

  return (
    <section className="editorial-container" aria-label="Featured Collection Spotlight">
      <div className="relative bg-gradient-to-br from-[#121318] via-[#181920] to-[#0E0F14] text-white border border-white/10 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[360px] shadow-2xl shadow-black/80 group">
        {/* Subtle ambient radial glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5C518]/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* Left/Main Merchandise Image (7 cols on desktop) */}
        <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto bg-[#0E0F13] p-6 sm:p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-contain object-center p-4 sm:p-8 group-hover:scale-105 transition-all duration-500"
          />
        </div>

        {/* Right Editorial Copy (5 cols on desktop) */}
        <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-center space-y-4 z-10">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#F5C518]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{subtitle}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            {title}
          </h2>

          {description && (
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-md line-clamp-3 font-sans">
              {description}
            </p>
          )}

          <div className="pt-2">
            <Link
              href={shopUrl}
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all min-h-[44px] group/btn"
            >
              <span>{buttonLabel}</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
