"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Check,
  ShoppingBag,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";
import { ArtworkFrame } from "@/components/ui/Artwork";

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

  // Navigation & Parameter Management Helper.
  // Filter changes reset to page 1; an explicit page change is preserved.
  const applyParams = (updatedParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updatedParams).forEach(([key, val]) => {
      if (val !== null && val.trim() !== "") {
        params.set(key, val.trim());
      } else {
        params.delete(key);
      }
    });
    if (!("page" in updatedParams)) params.set("page", "1");
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

  const isCollectionRoute = baseUrl.startsWith("/collections");
  const crumbs = [
    { label: "Home", href: "/" },
    isCollectionRoute ? { label: "Collections", href: "/collections" } : { label: "Shop", href: "/shop" },
  ];

  const chip =
    "inline-flex items-center gap-1.5 h-7 px-3 rounded-full border border-white/10 bg-white/[0.03] text-[11px] text-[#F7F7F5] hover:border-rose-400/50 hover:text-rose-200 transition-colors";
  const control =
    "h-9 rounded-[6px] border border-white/10 bg-[#111318] text-[12px] text-[#F7F7F5] focus:outline-none focus:border-[#F5C518]/60";
  const pill = (active: boolean) =>
    `shrink-0 h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] border transition-colors ${
      active ? "bg-[#F5C518] border-[#F5C518] text-[#08090B]" : "border-white/[0.12] text-[#F7F7F5]/85 hover:border-white/30"
    }`;

  const sortSelect = (
    <select
      value={sortBy}
      onChange={(e) => applyParams({ sortBy: e.target.value })}
      className={`${control} px-3 pr-8 cursor-pointer`}
      aria-label="Sort products"
    >
      <option value="newest">Sort: Newest</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="featured">Featured</option>
      <option value="name-asc">Name: A–Z</option>
    </select>
  );

  return (
    <div className="text-[#F7F7F5]">
      {/* 1. Compact artwork header band (reference: "Collections" page header) */}
      <section className="group relative overflow-hidden border-b border-white/[0.06]">
        {categoryImage ? (
          <ArtworkFrame
            src={categoryImage}
            alt={title}
            align="right"
            containClassName="w-[120px] sm:w-[170px] lg:w-[200px] py-5 mr-4 lg:mr-10"
            coverPosition="70% center"
            ambientOpacity={0.35}
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(245,197,24,0.08),transparent_55%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090B] via-[#08090B]/85 to-[#08090B]/20" />

        <div className="ff-container relative py-8 sm:py-10 lg:py-12 min-h-[180px] lg:min-h-[220px] flex flex-col justify-center gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-[#9A9DA5]">
            {crumbs.map((c) => (
              <React.Fragment key={c.href}>
                <Link href={c.href} className="hover:text-white transition-colors">
                  {c.label}
                </Link>
                <span className="text-[#4A4D55]">/</span>
              </React.Fragment>
            ))}
            <span className="text-[#F7F7F5] truncate max-w-[220px] sm:max-w-none">{title}</span>
          </nav>
          {eyebrow && <p className="ff-eyebrow">{eyebrow}</p>}
          <h1 className="text-[30px] sm:text-[40px] lg:text-[46px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white max-w-[70%] sm:max-w-[65%]">
            {title}
          </h1>
          {description && (
            <p className="text-[13px] sm:text-[14px] text-[#9A9DA5] leading-relaxed max-w-xl line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </section>

      <div className="ff-container py-6 lg:py-8 space-y-5">
        {/* 2. Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {!activeCategorySlug && categories.length > 0 && (
              <>
                <button type="button" onClick={() => applyParams({ category: null })} className={pill(!currentCategory)}>
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => applyParams({ category: c.slug })}
                    className={pill(currentCategory === c.slug)}
                  >
                    {c.name}
                  </button>
                ))}
              </>
            )}
            <span className="shrink-0 text-[12px] text-[#9A9DA5] lg:ml-2">
              {totalCount > 0 ? (
                <>
                  Showing <span className="text-white">{startItemIdx}–{endItemIdx}</span> of{" "}
                  <span className="text-white">{totalCount}</span>
                </>
              ) : (
                "0 products"
              )}
            </span>
          </div>

          {/* Desktop controls */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => applyParams({ inStockOnly: inStockOnly ? null : "true" })}
              className={`h-9 px-3.5 rounded-[6px] border text-[12px] flex items-center gap-1.5 transition-colors ${
                inStockOnly
                  ? "border-[#F5C518]/60 text-[#F5C518] bg-[#F5C518]/10"
                  : "border-white/10 bg-[#111318] text-[#F7F7F5]/85 hover:border-white/25"
              }`}
              aria-pressed={inStockOnly}
            >
              {inStockOnly && <Check className="w-3.5 h-3.5" />}
              In stock only
            </button>
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                handlePriceApply();
              }}
            >
              <input
                type="number"
                inputMode="numeric"
                placeholder="Min ₹"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className={`${control} w-[84px] px-2.5`}
                aria-label="Minimum price"
              />
              <span className="text-[#6E717A] text-xs">–</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Max ₹"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className={`${control} w-[84px] px-2.5`}
                aria-label="Maximum price"
              />
              <button
                type="submit"
                className="h-9 px-3 rounded-[6px] border border-white/10 bg-[#111318] text-[12px] hover:border-white/25"
              >
                Go
              </button>
            </form>
            {sortSelect}
          </div>

          {/* Mobile controls */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex-1 h-10 rounded-[6px] border border-white/10 bg-[#111318] text-[12px] font-semibold flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#F5C518]" />
              Filters{hasActiveFilters ? " · Active" : ""}
            </button>
            <div className="flex-1 [&>select]:w-full [&>select]:h-10">{sortSelect}</div>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {currentQuery && (
              <button type="button" onClick={() => applyParams({ query: null })} className={chip}>
                Search: &ldquo;{currentQuery}&rdquo; <X className="w-3 h-3" />
              </button>
            )}
            {currentCategory && !activeCategorySlug && (
              <button type="button" onClick={() => applyParams({ category: null })} className={chip}>
                {activeCategoryObj?.name || currentCategory} <X className="w-3 h-3" />
              </button>
            )}
            {inStockOnly && (
              <button type="button" onClick={() => applyParams({ inStockOnly: null })} className={chip}>
                In stock <X className="w-3 h-3" />
              </button>
            )}
            {(minPriceParam || maxPriceParam) && (
              <button type="button" onClick={() => applyParams({ minPrice: null, maxPrice: null })} className={chip}>
                {minPriceParam ? formatPrice(Number(minPriceParam)) : "₹0"} –{" "}
                {maxPriceParam ? formatPrice(Number(maxPriceParam)) : "Max"} <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F5C518] hover:underline ml-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}

        {/* Mobile filter sheet */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={() => setIsMobileFilterOpen(false)} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-lg bg-[#111318] border-t border-white/10 rounded-t-2xl p-5 overflow-y-auto max-h-[85vh] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.1em]">Filters</h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!activeCategorySlug && categories.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E717A]">Category</span>
                  <select
                    value={currentCategory}
                    onChange={(e) => applyParams({ category: e.target.value || null })}
                    className={`${control} w-full h-11 px-3`}
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-3 h-11 px-3 rounded-[6px] border border-white/10 bg-[#0D0E12] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => applyParams({ inStockOnly: e.target.checked ? "true" : null })}
                  className="w-4 h-4 accent-[#F5C518]"
                />
                <span className="text-[13px]">In stock only</span>
              </label>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E717A]">Price range (₹)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Min ₹"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className={`${control} h-11 px-3`}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Max ₹"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className={`${control} h-11 px-3`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2">
                <button type="button" onClick={handlePriceApply} className="ff-btn ff-btn-gold w-full">
                  Apply Filters
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="w-full h-10 text-[12px] font-semibold text-[#F5C518]"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Product grid */}
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
            className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 transition-opacity duration-200 ${
              isPending ? "opacity-50" : "opacity-100"
            }`}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* 4. Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/[0.08] text-[12px]">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => applyParams({ page: String(currentPage - 1) })}
              className="ff-btn ff-btn-outline ff-btn-sm disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-[#9A9DA5]">
              Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => applyParams({ page: String(currentPage + 1) })}
              className="ff-btn ff-btn-outline ff-btn-sm disabled:opacity-30 disabled:pointer-events-none"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
