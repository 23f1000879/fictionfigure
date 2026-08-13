"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";

interface ProductFiltersProps {
  categories: { id: string; name: string; slug: string; _count: { products: number } }[];
  brands: string[];
  franchises: string[];
}

export function ProductFilters({ categories, brands, franchises }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentFranchise = searchParams.get("franchise") || "";
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  };

  const handleReset = () => {
    router.push("/shop");
  };

  return (
    <div className="space-y-8 text-xs">
      {/* Reset Action */}
      {(currentCategory || currentBrand || currentFranchise || inStockOnly || minPrice || maxPrice) && (
        <button
          onClick={handleReset}
          className="flex items-center text-[#6B6B6B] hover:text-[#111111] font-medium tracking-wide uppercase text-[10px]"
        >
          <RotateCcw className="w-3 h-3 mr-1.5" /> Reset Filters
        </button>
      )}

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="font-semibold uppercase tracking-widest text-[#111111] text-[11px] border-b border-[#E5E5E2] pb-2">
          Category
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => updateParam("category", null)}
            className={`block text-left w-full hover:text-[#111111] ${
              !currentCategory ? "font-bold text-[#111111]" : "text-[#6B6B6B]"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam("category", cat.slug)}
              className={`flex justify-between items-center w-full text-left hover:text-[#111111] ${
                currentCategory === cat.slug ? "font-bold text-[#111111]" : "text-[#6B6B6B]"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] text-[#6B6B6B] font-mono">({cat._count.products})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold uppercase tracking-widest text-[#111111] text-[11px] border-b border-[#E5E5E2] pb-2">
            Manufacturer / Brand
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
            <button
              onClick={() => updateParam("brand", null)}
              className={`block text-left w-full hover:text-[#111111] ${
                !currentBrand ? "font-bold text-[#111111]" : "text-[#6B6B6B]"
              }`}
            >
              All Brands
            </button>
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => updateParam("brand", b)}
                className={`block text-left w-full hover:text-[#111111] truncate ${
                  currentBrand === b ? "font-bold text-[#111111]" : "text-[#6B6B6B]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Franchise */}
      {franchises.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold uppercase tracking-widest text-[#111111] text-[11px] border-b border-[#E5E5E2] pb-2">
            Franchise / Universe
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
            <button
              onClick={() => updateParam("franchise", null)}
              className={`block text-left w-full hover:text-[#111111] ${
                !currentFranchise ? "font-bold text-[#111111]" : "text-[#6B6B6B]"
              }`}
            >
              All Franchises
            </button>
            {franchises.map((f) => (
              <button
                key={f}
                onClick={() => updateParam("franchise", f)}
                className={`block text-left w-full hover:text-[#111111] truncate ${
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
        <label className="flex items-center space-x-2 text-[#111111] cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => updateParam("inStockOnly", e.target.checked ? "true" : null)}
            className="accent-[#111111]"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="font-semibold uppercase tracking-widest text-[#111111] text-[11px] border-b border-[#E5E5E2] pb-2">
          Price Range (₹)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam("minPrice", e.target.value || null)}
            className="w-full p-2 bg-white border border-[#E5E5E2] text-[#111111] placeholder-[#6B6B6B] focus:border-[#111111] focus:outline-none font-mono text-xs"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam("maxPrice", e.target.value || null)}
            className="w-full p-2 bg-white border border-[#E5E5E2] text-[#111111] placeholder-[#6B6B6B] focus:border-[#111111] focus:outline-none font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}
