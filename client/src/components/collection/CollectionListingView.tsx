"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Filter,
  Check,
  ArrowUpDown,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { formatPrice } from "@/lib/utils";

export interface CategoryData {
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

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  category?: { name: string; slug?: string };
  images: { url: string; altText?: string | null }[];
  variants?: { id: string; title: string; price: number; sku: string; inventoryCount: number }[];
}

interface CollectionListingViewProps {
  title: string;
  eyebrow?: string;
  description?: string;
  categoryImage?: string | null;
  activeCategorySlug?: string;
  baseUrl?: string; // "/shop" or "/collections"
  products: ProductData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  categories: CategoryData[];
  brands: string[];
  franchises: string[];
}

export function CollectionListingView({
  title,
  eyebrow = "COLLECTION",
  description,
  categoryImage,
  activeCategorySlug = "",
  baseUrl = "/shop",
  products,
  totalCount,
  totalPages,
  currentPage,
  categories,
  brands,
  franchises,
}: CollectionListingViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Active Filter Values
  const currentCategory = activeCategorySlug || searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentFranchise = searchParams.get("franchise") || "";
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "newest";

  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  // Navigation Helper
  const applyParams = (updatedParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updatedParams).forEach(([key, val]) => {
      if (val !== null && val.trim() !== "") {
        params.set(key, val.trim());
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1");
    startTransition(() => {
      router.push(`${baseUrl}?${params.toString()}`);
    });
  };

  const handlePriceApply = () => {
    applyParams({
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
    });
  };

  const handleResetFilters = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    startTransition(() => {
      if (activeCategorySlug) {
        router.push(`/collections/${activeCategorySlug}`);
      } else {
        router.push(baseUrl);
      }
    });
  };

  const hasActiveFilters =
    Boolean(currentCategory && !activeCategorySlug) ||
    Boolean(currentBrand) ||
    Boolean(currentFranchise) ||
    inStockOnly ||
    Boolean(minPriceParam) ||
    Boolean(maxPriceParam);

  const startItemIdx = totalCount === 0 ? 0 : (currentPage - 1) * 12 + 1;
  const endItemIdx = Math.min(currentPage * 12, totalCount);

  return (
    <div className="editorial-container py-8 sm:py-12 space-y-8 text-[#111111]">
      {/* 1. Subtle Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">
        <Link href="/" className="hover:text-[#111111] transition-colors">
          HOME
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#111111] transition-colors">
          COLLECTIONS
        </Link>
        {title && (
          <>
            <span>/</span>
            <span className="text-[#111111]">{title}</span>
          </>
        )}
      </nav>

      {/* 2. Compact Editorial Collection Header */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 sm:p-8 lg:p-10 grid grid-cols-1 md:grid-cols-12 items-center gap-6 shadow-xs">
        <div className={categoryImage ? "md:col-span-7 space-y-2.5" : "md:col-span-12 space-y-2.5"}>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] block">
            {eyebrow}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-[#111111] leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed max-w-xl">
              {description}
            </p>
          )}
        </div>

        {categoryImage && (
          <div className="md:col-span-5 relative aspect-[16/10] bg-[#F7F7F5] border border-[#E5E5E2] p-4">
            <Image
              src={categoryImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-contain object-center p-2"
              priority
            />
          </div>
        )}
      </div>

      {/* 3. Horizontal Filter Toolbar & Sort Selector (Desktop & Tablet) */}
      <div className="bg-white border border-[#E5E5E2] p-3.5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-xs">
        {/* Left: Product Count & Active Filters Summary */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <span className="font-mono font-bold text-xs text-[#111111]">
            {totalCount > 0 ? (
              <span>
                SHOWING {startItemIdx}–{endItemIdx} OF {totalCount} PRODUCTS
              </span>
            ) : (
              <span>0 PRODUCTS FOUND</span>
            )}
          </span>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[#A83232] hover:underline font-bold text-[10px] uppercase tracking-wider flex items-center shrink-0"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> CLEAR FILTERS
            </button>
          )}
        </div>

        {/* Right: Desktop Filter Dropdowns & Sort Selector */}
        <div className="hidden lg:flex items-center space-x-3">
          {/* Category Selector (if on main shop view) */}
          {!activeCategorySlug && categories.length > 0 && (
            <div className="relative">
              <select
                value={currentCategory}
                onChange={(e) => applyParams({ category: e.target.value || null })}
                className="bg-[#F7F7F5] border border-[#E5E5E2] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#111111] focus:outline-none cursor-pointer pr-7 rounded-none"
              >
                <option value="">ALL CATEGORIES</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Availability Toggle */}
          <button
            type="button"
            onClick={() => applyParams({ inStockOnly: inStockOnly ? null : "true" })}
            className={`px-3 py-1.5 border text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5 rounded-none ${
              inStockOnly
                ? "bg-[#111111] text-white border-[#111111]"
                : "bg-[#F7F7F5] text-[#111111] border-[#E5E5E2] hover:border-[#111111]"
            }`}
          >
            {inStockOnly && <Check className="w-3 h-3 text-[#D4AF37]" />}
            <span>IN STOCK ONLY</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1.5 bg-[#F7F7F5] border border-[#E5E5E2] px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => applyParams({ sortBy: e.target.value })}
              className="bg-transparent font-semibold text-xs text-[#111111] focus:outline-none cursor-pointer uppercase"
            >
              <option value="newest">NEWEST</option>
              <option value="price-asc">PRICE: LOW TO HIGH</option>
              <option value="price-desc">PRICE: HIGH TO LOW</option>
              <option value="featured">FEATURED</option>
              <option value="name-asc">NAME: A-Z</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter & Sort Drawer Launcher (< lg) */}
        <div className="flex lg:hidden items-center justify-between w-full gap-2">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 py-2.5 px-4 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#111111]" />
            <span>REFINE & FILTER</span>
          </button>
          
          <div className="flex items-center space-x-1 bg-[#F7F7F5] border border-[#E5E5E2] px-2.5 py-2">
            <select
              value={sortBy}
              onChange={(e) => applyParams({ sortBy: e.target.value })}
              className="bg-transparent font-bold text-xs text-[#111111] focus:outline-none cursor-pointer uppercase"
            >
              <option value="newest">NEWEST</option>
              <option value="price-asc">PRICE: LOW TO HIGH</option>
              <option value="price-desc">PRICE: HIGH TO LOW</option>
              <option value="featured">FEATURED</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Mobile Drawer Modal (< lg) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  FILTER COLLECTIBLES
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#111111]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              {!activeCategorySlug && categories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-widest text-[#111111] text-[10px] border-b border-[#E5E5E2] pb-1">
                    CATEGORY
                  </h4>
                  <select
                    value={currentCategory}
                    onChange={(e) => applyParams({ category: e.target.value || null })}
                    className="w-full p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] text-xs font-semibold uppercase text-[#111111]"
                  >
                    <option value="">ALL CATEGORIES</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Availability */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-widest text-[#111111] text-[10px] border-b border-[#E5E5E2] pb-1">
                  AVAILABILITY
                </h4>
                <label className="flex items-center space-x-2 text-[#111111] cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => applyParams({ inStockOnly: e.target.checked ? "true" : null })}
                    className="w-4 h-4 accent-[#111111]"
                  />
                  <span className="font-bold uppercase text-xs">IN STOCK ONLY</span>
                </label>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-widest text-[#111111] text-[10px] border-b border-[#E5E5E2] pb-1">
                  PRICE RANGE (₹)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] text-xs font-mono text-[#111111]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] text-xs font-mono text-[#111111]"
                  />
                </div>
                <button
                  onClick={handlePriceApply}
                  className="w-full py-2 bg-[#111111] text-white text-[10px] font-bold uppercase tracking-wider"
                >
                  APPLY PRICE
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E2] space-y-2">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest"
              >
                APPLY & CLOSE
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="w-full py-2 text-[#A83232] text-xs font-bold uppercase tracking-widest text-center"
                >
                  CLEAR FILTERS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Product Grid & Empty State */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E5E5E2] p-8 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-[#111111] uppercase tracking-wider">
            NO PRODUCTS FOUND
          </h3>
          <p className="text-xs text-[#6B6B6B] max-w-md mx-auto leading-relaxed">
            There are currently no products matching your selected filters in this collection.
          </p>
          <div className="pt-2">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center px-6 py-2.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-[#111111] transition-colors rounded-none"
            >
              <span>CONTINUE SHOPPING</span>
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </button>
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 transition-opacity duration-150 ${isPending ? "opacity-50" : "opacity-100"}`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* 6. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t border-[#E5E5E2] text-xs">
          {currentPage > 1 ? (
            <button
              onClick={() => applyParams({ page: String(currentPage - 1) })}
              className="flex items-center px-4 py-2 bg-white border border-[#E5E5E2] text-[#111111] hover:border-[#111111] font-bold uppercase tracking-wider rounded-none"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" /> PREVIOUS
            </button>
          ) : (
            <span className="opacity-40 cursor-not-allowed flex items-center px-4 py-2 border border-[#E5E5E2] text-[#6B6B6B] uppercase font-bold rounded-none">
              <ArrowLeft className="w-3.5 h-3.5 mr-2" /> PREVIOUS
            </span>
          )}

          <span className="font-mono text-xs font-bold text-[#6B6B6B]">
            PAGE {currentPage} OF {totalPages}
          </span>

          {currentPage < totalPages ? (
            <button
              onClick={() => applyParams({ page: String(currentPage + 1) })}
              className="flex items-center px-4 py-2 bg-white border border-[#E5E5E2] text-[#111111] hover:border-[#111111] font-bold uppercase tracking-wider rounded-none"
            >
              NEXT <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </button>
          ) : (
            <span className="opacity-40 cursor-not-allowed flex items-center px-4 py-2 border border-[#E5E5E2] text-[#6B6B6B] uppercase font-bold rounded-none">
              NEXT <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
