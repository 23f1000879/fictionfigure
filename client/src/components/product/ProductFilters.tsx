"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, SlidersHorizontal, X, Check } from "lucide-react";

interface ProductFiltersProps {
  categories: { id: string; name: string; slug: string; _count?: { products: number } }[];
  brands: string[];
  franchises: string[];
}

export function ProductFilters({ categories, brands, franchises }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentCategory = searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentFranchise = searchParams.get("franchise") || "";
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  const [localMinPrice, setLocalMinPrice] = useState(minPriceParam);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPriceParam);

  useEffect(() => {
    setLocalMinPrice(minPriceParam);
    setLocalMaxPrice(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim() !== "") {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (localMinPrice && localMinPrice.trim() !== "") {
      params.set("minPrice", localMinPrice.trim());
    } else {
      params.delete("minPrice");
    }
    if (localMaxPrice && localMaxPrice.trim() !== "") {
      params.set("maxPrice", localMaxPrice.trim());
    } else {
      params.delete("maxPrice");
    }
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  };

  const handleReset = () => {
    setLocalMinPrice("");
    setLocalMaxPrice("");
    router.push("/shop");
  };

  const hasActiveFilters =
    Boolean(currentCategory) ||
    Boolean(currentBrand) ||
    Boolean(currentFranchise) ||
    inStockOnly ||
    Boolean(minPriceParam) ||
    Boolean(maxPriceParam);

  const filterContent = (
    <div className="space-y-6 text-xs">
      {/* Reset Action */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="flex items-center text-[#A83232] hover:underline font-semibold tracking-wider uppercase text-[11px] min-h-[44px]"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Clear All Filters
        </button>
      )}

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="font-semibold uppercase tracking-widest text-[#111111] text-[11px] border-b border-[#E5E5E2] pb-2">
          Category
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => updateParam("category", null)}
            className={`block text-left w-full hover:text-[#111111] min-h-[36px] py-1 transition-colors ${
              !currentCategory ? "font-bold text-[#111111] underline" : "text-[#6B6B6B]"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = currentCategory === cat.slug || currentCategory === cat.id;
            const count = cat._count?.products ?? 0;
            return (
              <button
                key={cat.id}
                onClick={() => updateParam("category", cat.slug)}
                className={`flex justify-between items-center w-full text-left hover:text-[#111111] min-h-[36px] py-1 transition-colors ${
                  isSelected ? "font-bold text-[#111111]" : "text-[#6B6B6B]"
                }`}
              >
                <span className="truncate pr-2">{cat.name}</span>
                <span className="text-[10px] text-[#6B6B6B] font-mono shrink-0">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand / Manufacturer */}
      {brands.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold uppercase tracking-widest text-[#111111] text-[11px] border-b border-[#E5E5E2] pb-2">
            Manufacturer / Brand
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
            <button
              onClick={() => updateParam("brand", null)}
              className={`block text-left w-full hover:text-[#111111] min-h-[36px] py-1 transition-colors ${
                !currentBrand ? "font-bold text-[#111111] underline" : "text-[#6B6B6B]"
              }`}
            >
              All Brands
            </button>
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => updateParam("brand", b)}
                className={`block text-left w-full hover:text-[#111111] truncate min-h-[36px] py-1 transition-colors ${
                  currentBrand === b ? "font-bold text-[#111111]" : "text-[#6B6B6B]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Franchise / Universe */}
      {franchises.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold uppercase tracking-widest text-[#111111] text-[11px] border-b border-[#E5E5E2] pb-2">
            Franchise / Universe
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
            <button
              onClick={() => updateParam("franchise", null)}
              className={`block text-left w-full hover:text-[#111111] min-h-[36px] py-1 transition-colors ${
                !currentFranchise ? "font-bold text-[#111111] underline" : "text-[#6B6B6B]"
              }`}
            >
              All Franchises
            </button>
            {franchises.map((f) => (
              <button
                key={f}
                onClick={() => updateParam("franchise", f)}
                className={`block text-left w-full hover:text-[#111111] truncate min-h-[36px] py-1 transition-colors ${
                  currentFranchise === f ? "font-bold text-[#111111]" : "text-[#6B6B6B]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      <div className="space-y-3">
        <h4 className="font-semibold uppercase tracking-widest text-[#111111] text-[11px] border-b border-[#E5E5E2] pb-2">
          Availability
        </h4>
        <label className="flex items-center space-x-2 text.111111 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => updateParam("inStockOnly", e.target.checked ? "true" : null)}
            className="w-4 h-4 accent-[#111111] cursor-pointer"
          />
          <span className="font-medium">In Stock Only</span>
        </label>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="font-semibold uppercase tracking-widest text-[#111111] text-[11px] border-b border-[#E5E5E2] pb-2">
          Price Range (₹)
        </h4>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
              onBlur={applyPriceFilter}
              className="w-full p-2.5 min-h-[44px] bg-white border border-[#E5E5E2] text-[#111111] placeholder-[#6B6B6B] focus:border-[#111111] focus:outline-none font-mono text-xs"
            />
            <input
              type="number"
              placeholder="Max"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
              onBlur={applyPriceFilter}
              className="w-full p-2.5 min-h-[44px] bg-white border border-[#E5E5E2] text-[#111111] placeholder-[#6B6B6B] focus:border-[#111111] focus:outline-none font-mono text-xs"
            />
          </div>
          <button
            type="button"
            onClick={applyPriceFilter}
            className="w-full py-2 bg-[#111111] text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-black transition-colors"
          >
            Apply Price
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Drawer Button (< lg) */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full min-h-[44px] px-4 py-3 bg-white border border-[#E5E5E2] text-[#111111] text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#111111]" />
          <span>Filter & Refine Collectibles</span>
        </button>

        {/* Mobile Slide-Over Drawer Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-xs">
            <div className="relative w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-4 mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                    Refine Collectibles
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#111111]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {filterContent}
              </div>

              <div className="pt-4 border-t border-[#E5E5E2]">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full min-h-[44px] bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest py-3"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Filter Sidebar (>= lg) */}
      <div className="hidden lg:block">{filterContent}</div>
    </>
  );
}
