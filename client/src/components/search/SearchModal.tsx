"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  category: { name: string };
  images: { url: string }[];
}

export function SearchModal() {
  const { isSearchOpen, setIsSearchOpen } = useCart();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products?query=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        setResults(data.products || []);
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Backdrop click listener */}
      <div
        className="fixed inset-0"
        onClick={() => setIsSearchOpen(false)}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-[#F7F7F5] border border-[#E5E5E2] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Input Header */}
        <div className="relative flex items-center px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-[#E5E5E2] bg-white">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#6B6B6B] mr-2.5 sm:mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search figures, statues, franchises..."
            className="w-full bg-transparent text-[#111111] placeholder-[#6B6B6B] focus:outline-none text-xs sm:text-base font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-[#6B6B6B] hover:text-[#111111] mr-2 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="px-2 py-1 text-[11px] uppercase tracking-wider text-[#6B6B6B] hover:text-[#111111] border border-[#E5E5E2] rounded-none shrink-0 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Clean Results Panel (No hardcoded promo chips/brands) */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-[#6B6B6B]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-xs">Searching collection catalog...</span>
            </div>
          )}

          {!isLoading && !query && (
            <div className="text-center py-8 text-[#6B6B6B]">
              <p className="text-xs">Type a character name, figure title, or franchise to search...</p>
            </div>
          )}

          {!isLoading && query && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6B6B6B] border-b border-[#E5E5E2] pb-2">
                <span>{results.length} Products Found</span>
                <Link
                  href={`/shop?query=${encodeURIComponent(query)}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="hover:text-[#111111] flex items-center gap-1 font-medium"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center space-x-3 p-2 bg-white border border-[#E5E5E2] hover:border-[#111111] transition-colors group min-w-0"
                  >
                    <div className="relative w-14 h-14 bg-[#F0F0ED] shrink-0 overflow-hidden border border-[#E5E5E2]">
                      {product.images?.[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-[#6B6B6B]">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-[9px] uppercase font-semibold text-[#6B6B6B] block tracking-wide truncate">
                        {product.brand}
                      </span>
                      <h5 className="text-xs font-semibold text-[#111111] truncate group-hover:underline">
                        {product.name}
                      </h5>
                      <span className="text-xs font-mono font-semibold text-[#111111] block">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-8 space-y-1">
              <p className="text-xs text-[#111111] font-semibold">No figures matched your query</p>
              <p className="text-[11px] text-[#6B6B6B]">
                Try searching by character name, or browse our{" "}
                <Link
                  href="/shop"
                  onClick={() => setIsSearchOpen(false)}
                  className="underline text-[#111111]"
                >
                  full catalog
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
