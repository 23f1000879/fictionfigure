"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

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
  subtitle = "SPOTLIGHT",
  description,
  imageUrl,
  shopUrl = "/shop",
  buttonLabel = "SHOP COLLECTION",
}: FeaturedCollectionProps) {
  if (!imageUrl) return null;

  return (
    <section className="editorial-container" aria-label="Featured Collection Spotlight">
      <div className="bg-[#111111] text-white border border-[#E5E5E2] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[320px]">
        {/* Left Merchandise Image (55% width) */}
        <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto bg-[#1A1A1A] p-4 sm:p-6 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#222222]">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-contain object-center p-3 sm:p-6"
          />
        </div>

        {/* Right Compact Text Content (45% width) */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center space-y-3.5 z-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            {subtitle}
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-tight text-white leading-snug">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-white/70 leading-relaxed max-w-md line-clamp-3">
              {description}
            </p>
          )}
          <div className="pt-1">
            <Link
              href={shopUrl}
              className="inline-flex items-center px-5 py-2.5 bg-[#D4AF37] text-[#111111] hover:bg-white text-xs font-bold uppercase tracking-wider transition-colors duration-150 rounded-none group"
            >
              <span>{buttonLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
