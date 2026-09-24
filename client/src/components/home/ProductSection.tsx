"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  eyebrow = "CURATED SELECTION",
  title,
  viewAllUrl = "/shop",
  viewAllText = "VIEW ALL",
  products,
}: ProductSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="editorial-container space-y-6" aria-label={title}>
      {/* Editorial Section Header */}
      <div className="flex items-end justify-between border-b border-[#E5E5E2] pb-3.5">
        <div>
          {eyebrow && (
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] block mb-0.5">
              {eyebrow}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl font-semibold text-[#111111] tracking-tight">
            {title}
          </h2>
        </div>
        {viewAllUrl && (
          <Link
            href={viewAllUrl}
            className="text-xs font-bold uppercase tracking-wider text-[#111111] hover:text-[#D4AF37] transition-colors flex items-center group"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Product Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
