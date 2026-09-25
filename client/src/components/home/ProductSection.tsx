"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";

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
  viewAllUrl?: string;
  viewAllText?: string;
  products: ProductItem[];
}

export function ProductSection({
  eyebrow = "FEATURED FIGURES",
  title,
  viewAllUrl = "/shop",
  viewAllText = "VIEW ALL",
  products,
}: ProductSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="editorial-container space-y-6" aria-label={title}>
      {/* Editorial Section Header */}
      <div className="flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          {eyebrow && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#F5C518] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{eyebrow}</span>
            </div>
          )}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight uppercase">
            {title}
          </h2>
        </div>
        {viewAllUrl && (
          <Link
            href={viewAllUrl}
            className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#F5C518] transition-colors flex items-center group font-mono"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Product Responsive Grid (4 Desktop, 3 Tablet, 2 Mobile) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
