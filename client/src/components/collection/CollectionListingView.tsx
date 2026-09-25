"use client";

import React, { useState, useTransition, useEffect } from "react";
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
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
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
  eyebrow = "THE VAULT",
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
  const currentQuery = searchParams.get("query") || "";
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "newest";

  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  useEffect(() => {
    setMinPriceInput(minPriceParam);
    setMaxPriceInput(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  // Lock scroll when mobile filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFilterOpen]);

  // Navigation & Parameter Management Helper
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
    setIsMobileFilterOpen(false);
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
    setIsMobileFilterOpen(false);
  };

  const hasActiveFilters =
    Boolean(currentCategory && !activeCategorySlug) ||
    Boolean(currentBrand) ||
    Boolean(currentFranchise) ||
    Boolean(currentQuery) ||
    inStockOnly ||
    Boolean(minPriceParam) ||
    Boolean(maxPriceParam);

  const activeCategoryObj = categories.find((c) => c.slug === currentCategory);

  const startItemIdx = totalCount === 0 ? 0 : (currentPage - 1) * 12 + 1;
  const endItemIdx = Math.min(currentPage * 12, totalCount);

  return (
    <div className="editorial-container py-8 sm:py-12 space-y-8 text-white min-h-screen">
      {/* 1. Subtle Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[#64748B]"
      >
        <Link href="/" className="hover:text-[#F5C518] transition-colors">
          HOME
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#F5C518] transition-colors">
          VAULT
        </Link>
        {title && (
          <>
            <span>/</span>
            <span className="text-white truncate max-w-[200px] sm:max-w-none">{title}</span>
          </>
        )}
      </nav>

      {/* 2. Compact Editorial Collection Header */}
      <div className="relative bg-gradient-to-br from-[#121318] via-[#181920] to-[#0E0F14] border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 md:grid-cols-12 items-center gap-6 shadow-2xl shadow-black/80 overflow-hidden">
        {/* Ambient subtle gold radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F5C518]/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className={categoryImage ? "md:col-span-7 space-y-3 z-10" : "md:col-span-12 space-y-3 z-10"}>
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#F5C518]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{eyebrow}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-xl font-sans">
              {description}
            </p>
          )}
        </div>

        {categoryImage && (
          <div className="md:col-span-5 relative aspect-[16/10] bg-[#0E0F13] border border-white/10 rounded-xl p-4 flex items-center justify-center overflow-hidden z-10">
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

      {/* Active Filter Removable Chips Strip */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] mr-1">
            Active Filters:
          </span>

          {currentQuery && (
            <button
              type="button"
              onClick={() => applyParams({ query: null })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181920] border border-white/10 text-xs text-white hover:border-rose-400/50 hover:text-rose-300 transition-all font-mono"
            >
              <span>Search: "{currentQuery}"</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {currentCategory && !activeCategorySlug && (
            <button
              type="button"
              onClick={() => applyParams({ category: null })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181920] border border-white/10 text-xs text-white hover:border-rose-400/50 hover:text-rose-300 transition-all font-mono"
            >
              <span>Category: {activeCategoryObj?.name || currentCategory}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {inStockOnly && (
            <button
              type="button"
              onClick={() => applyParams({ inStockOnly: null })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181920] border border-[#F5C518]/30 text-xs text-[#F5C518] hover:border-rose-400/50 hover:text-rose-300 transition-all font-mono"
            >
              <span>In Stock Only</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {(minPriceParam || maxPriceParam) && (
            <button
              type="button"
              onClick={() => applyParams({ minPrice: null, maxPrice: null })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181920] border border-white/10 text-xs text-white hover:border-rose-400/50 hover:text-rose-300 transition-all font-mono"
            >
              <span>
                Price: {minPriceParam ? formatPrice(Number(minPriceParam)) : "₹0"} –{" "}
                {maxPriceParam ? formatPrice(Number(maxPriceParam)) : "Max"}
              </span>
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] font-mono text-[#F5C518] hover:underline uppercase ml-2 flex items-center gap-1 cursor-pointer font-bold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        </div>
      )}

      {/* 3. Horizontal Filter Toolbar & Sort Selector */}
      <div className="bg-[#121318] border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-xl shadow-black/40">
        {/* Left: Product Count */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <span className="font-mono text-xs font-semibold text-[#94A3B8]">
            {totalCount > 0 ? (
              <span>
                SHOWING <strong className="text-white">{startItemIdx}–{endItemIdx}</strong> OF{" "}
                <strong className="text-white">{totalCount}</strong> FIGURES
              </span>
            ) : (
              <span>0 FIGURES FOUND</span>
            )}
          </span>
        </div>

        {/* Right: Desktop Filter Dropdowns & Sort Selector */}
        <div className="hidden lg:flex items-center space-x-3">
          {/* Category Selector (if on main shop view) */}
          {!activeCategorySlug && categories.length > 0 && (
            <div className="relative">
              <select
                value={currentCategory}
                onChange={(e) => applyParams({ category: e.target.value || null })}
                className="bg-[#181920] border border-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white focus:outline-none focus:border-[#F5C518] cursor-pointer rounded-xl pr-8"
              >
                <option value="">ALL UNIVERSES</option>
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
            className={`px-3.5 py-2 border text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 rounded-xl cursor-pointer ${
              inStockOnly
                ? "bg-[#F5C518]/15 text-[#F5C518] border-[#F5C518]/50 shadow-[0_0_12px_rgba(245,197,24,0.15)]"
                : "bg-[#181920] text-[#94A3B8] border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            {inStockOnly && <Check className="w-3.5 h-3.5 text-[#F5C518]" />}
            <span>IN STOCK ONLY</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2 bg-[#181920] border border-white/10 rounded-xl px-3.5 py-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#F5C518]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
              SORT:
            </span>
            <select
              value={sortBy}
              onChange={(e) => applyParams({ sortBy: e.target.value })}
              className="bg-transparent font-semibold text-xs text-white focus:outline-none cursor-pointer uppercase pr-2"
            >
              <option value="newest" className="bg-[#181920] text-white">NEWEST</option>
              <option value="price-asc" className="bg-[#181920] text-white">PRICE: LOW TO HIGH</option>
              <option value="price-desc" className="bg-[#181920] text-white">PRICE: HIGH TO LOW</option>
              <option value="featured" className="bg-[#181920] text-white">FEATURED</option>
              <option value="name-asc" className="bg-[#181920] text-white">NAME: A-Z</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter & Sort Drawer Launcher (< lg) */}
        <div className="flex lg:hidden items-center justify-between w-full gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 py-3 px-4 bg-[#181920] border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 rounded-xl min-h-[44px] active:scale-95 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#F5C518]" />
            <span>FILTERS {hasActiveFilters && "(ACTIVE)"}</span>
          </button>

          <div className="flex items-center space-x-1.5 bg-[#181920] border border-white/10 px-3 py-2.5 rounded-xl min-h-[44px]">
            <select
              value={sortBy}
              onChange={(e) => applyParams({ sortBy: e.target.value })}
              className="bg-transparent font-bold text-xs text-white focus:outline-none cursor-pointer uppercase pr-1"
            >
              <option value="newest" className="bg-[#181920] text-white">NEWEST</option>
              <option value="price-asc" className="bg-[#181920] text-white">PRICE: LOW → HIGH</option>
              <option value="price-desc" className="bg-[#181920] text-white">PRICE: HIGH → LOW</option>
              <option value="featured" className="bg-[#181920] text-white">FEATURED</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Mobile Bottom Sheet Filter Drawer (< lg) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileFilterOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-lg bg-[#121318] border-t border-white/10 rounded-t-3xl p-6 overflow-y-auto max-h-[85vh] space-y-6 shadow-2xl shadow-black animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#F5C518]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  FILTER VAULT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {/* Categories */}
              {!activeCategorySlug && categories.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                    UNIVERSE / CATEGORY
                  </span>
                  <select
                    value={currentCategory}
                    onChange={(e) => applyParams({ category: e.target.value || null })}
                    className="w-full p-3.5 bg-[#0E0F13] border border-white/10 rounded-xl text-xs font-semibold uppercase text-white focus:border-[#F5C518]"
                  >
                    <option value="">ALL UNIVERSES</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug} className="bg-[#121318]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Availability */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                  STOCK STATUS
                </span>
                <label className="flex items-center space-x-3 p-3 bg-[#0E0F13] border border-white/10 rounded-xl text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => applyParams({ inStockOnly: e.target.checked ? "true" : null })}
                    className="w-4 h-4 accent-[#F5C518]"
                  />
                  <span className="font-bold uppercase text-xs">IN STOCK ONLY</span>
                </label>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                  PRICE RANGE (₹)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-full p-3 bg-[#0E0F13] border border-white/10 rounded-xl text-xs font-mono text-white focus:border-[#F5C518] focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full p-3 bg-[#0E0F13] border border-white/10 rounded-xl text-xs font-mono text-white focus:border-[#F5C518] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <button
                type="button"
                onClick={handlePriceApply}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-xs font-bold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all min-h-[44px]"
              >
                APPLY FILTERS
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2.5 text-[#EF4444] text-xs font-mono font-bold uppercase tracking-widest text-center hover:underline cursor-pointer"
                >
                  RESET ALL FILTERS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Product Grid & Empty State */}
      {products.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-7 h-7 text-[#F5C518]" />}
          title="NO FIGURES FOUND"
          description="There are currently no collectible figures matching your selected filters in this collection."
          actionLabel="CLEAR ALL FILTERS"
          onAction={handleResetFilters}
          className="my-12"
        />
      ) : (
        <div
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 transition-opacity duration-200 ${
            isPending ? "opacity-50" : "opacity-100"
          }`}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* 6. Dark Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t border-white/10 text-xs font-mono">
          {currentPage > 1 ? (
            <button
              type="button"
              onClick={() => applyParams({ page: String(currentPage - 1) })}
              className="inline-flex items-center px-4 py-2.5 bg-[#181920] border border-white/10 hover:border-[#F5C518] text-white hover:text-[#F5C518] font-bold uppercase tracking-wider rounded-xl transition-all min-h-[44px] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> PREVIOUS
            </button>
          ) : (
            <span className="opacity-40 cursor-not-allowed inline-flex items-center px-4 py-2.5 bg-white/[0.02] border border-white/5 text-[#64748B] uppercase font-bold rounded-xl min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-2" /> PREVIOUS
            </span>
          )}

          <span className="font-mono text-xs font-bold text-[#94A3B8]">
            PAGE <strong className="text-white">{currentPage}</strong> OF{" "}
            <strong className="text-white">{totalPages}</strong>
          </span>

          {currentPage < totalPages ? (
            <button
              type="button"
              onClick={() => applyParams({ page: String(currentPage + 1) })}
              className="inline-flex items-center px-4 py-2.5 bg-[#181920] border border-white/10 hover:border-[#F5C518] text-white hover:text-[#F5C518] font-bold uppercase tracking-wider rounded-xl transition-all min-h-[44px] cursor-pointer"
            >
              NEXT <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <span className="opacity-40 cursor-not-allowed inline-flex items-center px-4 py-2.5 bg-white/[0.02] border border-white/5 text-[#64748B] uppercase font-bold rounded-xl min-h-[44px]">
              NEXT <ArrowRight className="w-4 h-4 ml-2" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
